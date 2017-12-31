


const redisClient = require("./redis");
const rp = require('request-promise');
const Trip = require("./models/trip");
const moment = require("moment");
const generatePassword = require('password-generator');
const { getDirections, getDistanceBetween,sendNotification, getEta, getRealDistanceBetweenInMeters, calculateFare, getPlaceName } = require("./utils");

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
                console.log(data.pushId) ;
                sendNotification(data.pushId,"HI") ;

            }

        });

        socket.on("freeDriver:locationUpdate", function (data) {
            console.log(data.location.latitude + "," + data.location.longitude);
            redisClient.geoadd("drivers-free", data.location.longitude, data.location.latitude, socket.phone);
        });

        socket.on("passenger:request", (data) => {
            socket.phone = data.phone;
            socket.room = data.phone;
            socket.join(socket.room);


            redisClient.georadius("drivers-free", data.requestLocation.longitude, data.requestLocation.latitude, '4', "km", "WITHCOORD", "COUNT", "20", "ASC", function (err, result) {
                console.log(result);
                var phone = result[0][0];
                console.log("Founding " + phone);
                redisClient.zrem("drivers-free", phone);

                let currentDriverInRequest = "current-driver:" + socket.phone;
                redisClient.set(currentDriverInRequest, phone);

                io.sockets.in(phone).emit("request", data);

            });
        });


        socket.on("passenger:dropoff", data => {
            socket.broadcast.to(socket.room).emit("passenger:dropoff", data);
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


        socket.on("tripDriver:locationUpdate", data => {

            if (socket.inTrip) {
                let lastLocationKey = "driver-lastLocation:" + socket.phone;

                redisClient.get(lastLocationKey, (error, result) => {
                    let lastLocation = JSON.parse(result);
                    let locationsListKey = "trip-locations:" + socket.phone;
                    redisClient.rpush(locationsListKey, result);
                    getRealDistanceBetweenInMeters(lastLocation, data.location)
                        .then(distance => {
                            let key = "km:" + socket.room;
                            redisClient.get(key, (error, result) => {
                                console.log("Prev Distance = " + result);
                                console.log("New Real Distance = " + distance);

                                let prevDistance = parseFloat(result);
                                let newDistance = parseFloat(distance);

                                if (Math.abs(newDistance - prevDistance) < 60) //meter
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
            let locationsListKey = "trip-locations:" + socket.phone;
            redisClient.rpush(locationsListKey, JSON.stringify(data.location));

            let code = generatePassword(2, false, /\d/);

            redisClient.set("tripCode:" + socket.room, code);
            socket.emit("driver:tripCode", { code: code });
            socket.broadcast.to(socket.room).emit("driver:arrive", { code: code });
        });

        socket.on("driver:startTrip", () => {
            redisClient.set("startTime:" + socket.room, JSON.stringify(new Date()));
            socket.inTrip = true;
            let key = "km:" + socket.room;
            redisClient.set(key, 0);
            io.sockets.in(socket.room).emit("driver:startTrip");
        });

        socket.on("driver:endTrip", data => {

            let nowMoment = moment(new Date());
            let tripLocationsKey = "trip-locations:" + socket.phone;
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

                            let totalFare = calculateFare(tripMin, tripKm);

                            console.log("Fare = " + totalFare);

                            let totalKm = Math.round(tripKm);
                            let totalMin = Math.round(tripMin);

                            io.sockets.in(socket.room).emit("fare", { fare: totalFare, km: totalKm, time: totalMin });


                            let tripData = {
                                passenger: data.passengerId,
                                driver: data.driverId,
                                fare: totalFare,
                                km: totalKm,
                                min: totalMin,
                                arriveDate: arriveMoment.toDate(),
                                startDate: startMoment.toDate(),
                                endDate: nowMoment.toDate(),
                                requestLocation: data.requestLocation,
                                dropOffLocation: data.dropOffLocation,
                            }


                            getPlaceName(data.requestLocation[1], data.requestLocation[0]).then(requestPlaceName => {

                                getPlaceName(data.dropOffLocation[1], data.dropOffLocation[0]).then(dropPlaceName => {

                                    tripData.requestLocationName = requestPlaceName;
                                    tripData.dropOffLocationName = dropPlaceName;
                                    let trip = new Trip(tripData);


                                    trip.save();

                                    redisClient.lrange(tripLocationsKey, 0, -1, (err, results) => {
                                        if (results) {
                                            results.forEach(result => {
                                                let loc = JSON.parse(result);
                                                trip.path.push({ latitude: loc.latitude, longitude: loc.longitude });
                                            });

                                            trip.save();
                                        }
                                    })


                                })
                            })

                        });
                    }
                });
            });



        });


        socket.on("driver:fareOk", data => {

            let tripLocationsKey = "trip-locations:" + socket.phone;
            let arriveTimeKey = "arriveTime:" + socket.room;
            let startTimeKey = "startTime:" + socket.room;
            let distanceKey = "km:" + socket.room;

            redisClient.del(arriveTimeKey);
            redisClient.del(startTimeKey);
            redisClient.del(distanceKey);
            redisClient.del("driver-lastLocation:" + socket.phone);
            redisClient.del("tripCode:" + socket.room);
            redisClient.del(tripLocationsKey);

            let requestKey = "request:" + socket.room;

            if (redisClient.exists(requestKey))
                redisClient.del(requestKey); //SET of all Requested driver phones

            let currentDriverInRequest = "current-driver:" + socket.room;
            redisClient.del(currentDriverInRequest);

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

        socket.on("passenger:cancel", () => {
            console.log("Passenger Cancellllll");

            let currentDriverInRequest = "current-driver:" + socket.phone;
            redisClient.get(currentDriverInRequest, (err, result) => {
                io.sockets.in(result).emit("passenger:cancel");
                socket.broadcast.to(socket.room).emit("passenger:cancel");
                redisClient.del(currentDriverInRequest);
            })


        });

        socket.on("driver:afterPassCancel", () => {
            socket.leave(socket.room);
            socket.room = socket.phone;
            socket.join(socket.room); 
            
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
                let currentDriverInRequest = "current-driver:" + data.phone;
                redisClient.set(currentDriverInRequest, phone);

                io.sockets.in(phone).emit("request", data);
            }
            else
                isMemberAndSend(result, i + 1, requestKey, data);
        });

    }
}   