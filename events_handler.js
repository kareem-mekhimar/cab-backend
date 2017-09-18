
var redisClient = require("./redis");
var rp = require('request-promise');
const getEta = require("./utils/utils").getEta;
const getDirections = require("./utils/utils").getDirections;

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
            redisClient.geoadd("drivers-free", data.location.longitude, data.location.latitude, socket.phone);
        });


        socket.on("passenger:request", (data) => {
            socket.phone = data.phone;
            socket.room = data.phone;
            socket.join(socket.room);

            redisClient.georadius("drivers-free", data.requestLocation.longitude, data.requestLocation.latitude, '4', "km", "WITHCOORD", "COUNT", "1", "ASC", function (err, result) {
                var phone = result[0][0];
                console.log("Founding "+phone) ;
                redisClient.zrem("drivers-free", phone);
                io.sockets.in(phone).emit("request", data);
            });
        });

        socket.on("driver:accept", data => {

            socket.leave(socket.room);
            socket.room = data.passengerPhone;
            console.log(socket.room) ;
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
                    });

                });

            });

        });

        socket.on("driver:reject", data => {
            // socket.phone ;
        });

        socket.on("tripDriver:locationUpdate", data => {

            getEta(data.location, data.requestLocation).then(etaResult => {
                getDirections(data.location, data.requestLocation).then(dirResult => {
                    socket.broadcast.to(socket.room).emit("driver:location", {
                        location: data.location,
                        eta: etaResult,
                        polylines: dirResult
                    });
                });

            });

        });

        socket.on("arrive", data => {
            socket.broadcast.to(socket.room).emit("driver:arrive");
        });

        socket.on("disconnect", () => {
            console.log("Disconnection---");
            console.log(socket);
            if (socket.type === "driver") {
                redisClient.del(socket.phone);
                redisClient.zrem("drivers-free", socket.phone);
            }
            if (socket.room)
                socket.leave(socket.room);
        });

    })
} 