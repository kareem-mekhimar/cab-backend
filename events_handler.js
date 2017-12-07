


const redisClient = require("./redis");
const rp = require('request-promise');
const moment = require("moment");
const generatePassword = require('password-generator');
const { getDirections, getDistanceBetween, getEta, getRealDistanceBetweenInMeters, calculateFare } = require("./utils");

module.exports = (io) => {

    io.sockets.on("connection", function (socket) {
        console.log("Connection---");
        socket.on("identity", function (data) {
            let phone = data.phone;
            socket.room = phone;
            socket.phone = phone;
            socket.type = data.type;
            socket.inTrip = data.inTrip;
            socket.join(phone);

            console.log("Identity")
            console.log(data);

            if (socket.type == "driver") {
                redisClient.hmset(phone, "type", "driver", "name", data.name, "id", data.id, "phone", data.phone);
                if (!socket.inTrip)
                    redisClient.geoadd("drivers-free", data.location.longitude, data.location.latitude, phone);
            }
            else {

            }

        });

        socket.on("freeDriver:locationUpdate", function (data) {
            console.log(data.location.latitude + "," + data.location.longitude);
            redisClient.geoadd("drivers-free", data.location.longitude, data.location.latitude, socket.phone);
        });

        socket.on("passenger:request", (data) => {
            // socket.phone = data.phone;
            // socket.room = data.phone;
            // socket.join(socket.room);


            redisClient.georadius("drivers-free", data.requestLocation.longitude, data.requestLocation.latitude, '4', "km", "WITHCOORD", "COUNT", "20", "ASC", function (err, result) {
                console.log(result);
                var phone = result[0][0];
                console.log("Founding " + phone);
                redisClient.zrem("drivers-free", phone);
                io.sockets.in(phone).emit("request", data);

            });
        });


        socket.on("passenger:dropoff", data => {
            socket.broadcast.to(socket.room).emit("passenger:dropoff", data);
        });

        socket.on("driver:accept", data => {

            console.log("accept");

            console.log(data);

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

            console.log("arrive");
            console.log(data);

            redisClient.set("arriveTime:" + socket.room, JSON.stringify(new Date()));
            let lastLocationKey = "driver-lastLocation:" + socket.phone;
            redisClient.set(lastLocationKey, JSON.stringify(data.location));

            let code = generatePassword(2, false, /\d/);

            redisClient.set("tripCode:" + socket.room, code);
            socket.emit("driver:tripCode", { code: code });
            socket.broadcast.to(socket.room).emit("driver:arrive", { code: code });
        });
        //30.614521520503214,,32.27135282009841 

        // 30.618337137789208,,32.26964324712753 ring road
        // 30.6128555,,32.2719795 ma7akeem
        // 30.593265977428462,32.27863870561122
        socket.on("driver:startTrip", () => {
            redisClient.set("startTime:" + socket.room, JSON.stringify(new Date()));
            socket.inTrip = true;
            let key = "km:" + socket.room;
            redisClient.set(key, 0);
            io.sockets.in(socket.room).emit("driver:startTrip");
        });

        socket.on("driver:endTrip", () => {

            let nowMoment = moment(new Date());

            console.log(nowMoment);

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

                            let totalFare = calculateFare(tripMin, tripKm);

                            console.log("Fare = " + totalFare);

                            io.sockets.in(socket.room).emit("fare", { fare: totalFare, km: Math.round(tripKm), time: Math.round(tripMin) });
                        });
                    }

                    // redisClient.del(arriveTimeKey);
                    // redisClient.del(startTimeKey);
                    // redisClient.del(distanceKey);
                    // redisClient.del("driver-lastLocation:" + socket.phone);
                    // redisClient.del("tripCode:" + socket.room);

                    // socket.inTrip = false;
                    // // socket.leave(socket.room);
                    // // socket.room = socket.phone;
                    // // socket.join(socket.room);
                });
            });



        });


        socket.on("driver:fareOk", data => {

            let arriveTimeKey = "arriveTime:" + socket.room;
            let startTimeKey = "startTime:" + socket.room;
            let distanceKey = "km:" + socket.room;

            redisClient.del(arriveTimeKey);
            redisClient.del(startTimeKey);
            redisClient.del(distanceKey);
            redisClient.del("driver-lastLocation:" + socket.phone);
            redisClient.del("tripCode:" + socket.room);

            let requestKey = "request:" + socket.room;

            if (redisClient.exists(requestKey))
                redisClient.del(requestKey); //SET of all Requested driver phones

            socket.inTrip = false;
            socket.leave(socket.room);
            socket.room = socket.phone;
            socket.join(socket.room);
        });


        socket.on("driver:cancel", data => {
            let requestKey = "request:" + data.phone;
            redisClient.sadd(requestKey, socket.phone);

            redisClient.georadius("drivers-free", data.requestLocation.longitude, data.requestLocation.latitude, '4', "km", "WITHCOORD", "COUNT", "20", "ASC", function (err, result) {
                console.log("Georaduis")
                console.log(data);
                isMemberAndSend(result, 0, requestKey, data);
            });
        })

        socket.on("driver:active", data => {
            redisClient.geoadd("drivers-free", data.location.longitude, data.location.latitude, socket.phone);
        })

        socket.on("driver:busy", () => {
            redisClient.zrem("drivers-free", socket.phone);
        });

        socket.on("disconnect", () => {
            console.log("Disconnection---");
            console.log(socket.type);
            if (socket.type === "driver") {
                redisClient.del(socket.phone);
                redisClient.zrem("drivers-free", socket.phone);
                // let tripLocationKey = "driver-lastLocation:" + socket.phone;
                // if (redisClient.exists(tripLocationKey)) {
                //     redisClient.del(tripLocationKey);
                // }
            }
        });


    })



    function isMemberAndSend(result, i, requestKey, data) {
        if (i == result.length) {
            io.sockets.in(data.phone).emit("nodrivers");
            redisClient.del(requestKey);
            return;
        }


        let phone = result[i][0];
        console.log("Is Memeber Phone = " + phone);
        redisClient.sismember(requestKey, phone, (error, myResult) => {
            if (!myResult) { // && phone != socket.phone Not Member and Not Me
                redisClient.zrem("drivers-free", phone);
                io.sockets.in(phone).emit("request", data);
            }
            else
                isMemberAndSend(result, i + 1, requestKey, data);
        });

    }
} 