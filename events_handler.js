
const redisClient = require("./redis");
const rp = require('request-promise');
const moment = require("moment");
const generatePassword = require('password-generator');
const { getDirections, getDistanceBetween, getEta, getRealDistanceBetweenInMeters } = require("./utils");

module.exports = (io) => {

    io.sockets.on("connection", function (socket) {
        console.log("Connection---");
        socket.on("identity", function (data) {
            let phone = data.phone;
            socket.room = phone;
            socket.phone = phone;
            socket.type = "driver";
            socket.join(phone);
            redisClient.hmset(phone, "type", "driver", "name", data.name, "id", data.id, "phone", data.phone);
            redisClient.geoadd("drivers-free", data.location.longitude, data.location.latitude, phone);
        });

        socket.on("freeDriver:locationUpdate", function (data) {
            console.log(data.location.latitude + "," + data.location.longitude);
            redisClient.geoadd("drivers-free", data.location.longitude, data.location.latitude, socket.phone);
        });


        socket.on("passenger:request", (data) => {
            socket.phone = data.phone;
            socket.room = data.phone;
            socket.join(socket.room);

            redisClient.georadius("drivers-free", data.requestLocation.longitude, data.requestLocation.latitude, '4', "km", "WITHCOORD", "COUNT", "1", "ASC", function (err, result) {
                var phone = result[0][0];
                console.log("Founding " + phone);
                redisClient.zrem("drivers-free", phone);
                io.sockets.in(phone).emit("request", data);
            });
        });

        socket.on("driver:accept", data => {

            socket.leave(socket.room);
            socket.room = data.passengerPhone;
            socket.join(socket.room);

            redisClient.hgetall(socket.phone, (error, result) => {
                var driverInfo = {
                    car: data.car,
                    name: result.name,
                    id: result.id,
                    phone: result.phone
                }

                driverInfo.location = data.location;
                console.log(driverInfo);
                getEta(driverInfo.location, data.requestLocation).then(etaResult => {
                    getDirections(driverInfo.location, data.requestLocation).then(dirResult => {
                        driverInfo.eta = etaResult;
                        driverInfo.polylines = dirResult;
                        socket.broadcast.to(socket.room).emit("driver:accept", driverInfo);

                        if (getDistanceBetween(driverInfo.location, data.requestLocation) <= 300) {
                            socket.emit("driver:canArrive", {
                                canArrive: true
                            });
                        } else {
                            socket.emit("driver:canArrive", {
                                canArrive: false
                            });
                        }
                    });

                });

            });

        });

        socket.on("driver:reject", data => {
        });

        socket.on("tripDriver:locationUpdate", data => {

            if (socket.inTrip) {
                let lastLocationKey = "driver-lastLocation:" + socket.phone;
                redisClient.get(lastLocationKey, (error, result) => {
                    let lastLocation = JSON.parse(result);
                    getRealDistanceBetweenInMeters(lastLocation, data.location)
                        .then(distance => {
                            let key = "km:" + socket.room;
                            redisClient.get(key, (error, result) => {
                                console.log("Prev Distance = " + result);
                                console.log("New Real Distance = " + distance);

                                let prevDistance = parseFloat(result);
                                let newDistance = parseFloat(distance);

                                if (Math.abs(newDistance - prevDistance) < 15) //meter
                                    return;

                                let allDistance = prevDistance + newDistance;

                                console.log("New Distance = " + allDistance)
                                redisClient.set(key, allDistance);
                            });
                        });

                    redisClient.set(lastLocationKey, JSON.stringify(data.location));
                });

            } else {
                getEta(data.location, data.requestLocation).then(etaResult => {
                    getDirections(data.location, data.requestLocation).then(dirResult => {
                        socket.broadcast.to(socket.room).emit("driver:location", {
                            location: data.location,
                            eta: etaResult,
                            polylines: dirResult
                        });
                    });

                });
                if (getDistanceBetween(data.location, data.requestLocation) <= 300) {
                    socket.emit("driver:canArrive", {
                        canArrive: true
                    });
                } else {
                    socket.emit("driver:canArrive", {
                        canArrive: false
                    });
                }
            }

        });

        socket.on("arrive", data => {
            redisClient.set("arriveTime:" + socket.room, JSON.stringify(new Date()));
            let lastLocationKey = "driver-lastLocation:" + socket.phone;
            redisClient.set(lastLocationKey, JSON.stringify(data.location));

            let code = generatePassword(4, false, /\d/);
            redisClient.set("tripCode:" + socket.room, code);
            socket.emit("driver:tripCode", { code: code });
            socket.broadcast.to(socket.room).emit("driver:arrive", { code: code });
        });
// 30.593265977428462,32.27863870561122
        socket.on("driver:startTrip", () => {
            redisClient.set("startTime:" + socket.room, JSON.stringify(new Date()));
            socket.inTrip = true;
            let key = "km:" + socket.room;
            redisClient.set(key, 0);
            socket.broadcast.to(socket.room).emit("driver:startTrip");
        });

        socket.on("driver:endTrip", () => {

            let nowMoment = moment(new Date());

            let arriveTimeKey = "arriveTime:" + socket.room;

            redisClient.get(arriveTimeKey, (error, arriveDate) => {

                let arriveMoment = moment(JSON.parse(arriveDate));

                console.log("Arrived at = " + arriveMoment.format("hh:mm:ss a"));

                let startTimeKey = "startTime:" + socket.room;

                redisClient.get(startTimeKey, (error, startDate) => {
                    let startMoment = moment(JSON.parse(startDate));
                    console.log("Started at = " + startMoment.format("hh:mm:ss a"));
                    console.log("End at = " + nowMoment.format("hh:mm:ss a"));

                    let tripMin = nowMoment.diff(startMoment, 'minutes');
                    let arriveMin = startMoment.diff(arriveMoment, 'minutes');

                    if (arriveMin > 3) {
                        tripMin += (arriveMin - 3);
                    }

                    console.log("Trip Mins = " + tripMin);

                    let distanceKey = "km:" + socket.room;
                    if (redisClient.exists(distanceKey)) {
                        redisClient.get(distanceKey, (error, distance) => {
                            console.log("Trip Distance = " + distance);

                            let tripKm = parseFloat(distance) / 1000;

                            console.log("Distance in KM = " + tripKm);

                            //////////// FARE

                            let timeFare = (tripMin - 3) * 0.25;

                            let kmFactor = 1.7;

                            if (tripKm > 50)
                                kmFactor = 2.7; // Big Factor 

                            let kmFare = 5;

                            if (tripKm > 4) {
                                kmFare += (tripKm - 4) * kmFactor;
                            }

                            let totalFare = kmFare + timeFare;

                            if (totalFare < 9)
                                totalFare = 9;

                            console.log("Fare = " + totalFare);

                            io.sockets.in(socket.room).emit("fare", { fare: totalFare, km: tripKm, time: tripMin });
                        });
                    }

                    redisClient.del(arriveTimeKey);
                    redisClient.del(startTimeKey);
                    redisClient.del(distanceKey);
                    redisClient.del("driver-lastLocation:" + socket.phone);
                    redisClient.del("tripCode:" + socket.room);

                    socket.inTrip = false;
                    socket.leave(socket.room);
                    socket.room = socket.phone;
                    socket.join(socket.room);
                });
            });



        });

        socket.on("disconnect", () => {
            console.log("Disconnection---");
            console.log(socket);
            if (socket.type === "driver") {
                redisClient.del(socket.phone);
                redisClient.zrem("drivers-free", socket.phone);
                let tripLocationKey = "driver-lastLocation:" + socket.phone;
                if (redisClient.exists(tripLocationKey)) {
                    redisClient.del(tripLocationKey);
                }
            }
            if (socket.room)
                socket.leave(socket.room);
        });

    })
} 