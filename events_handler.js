
var redisClient = require("./redis");
var rp = require('request-promise');

module.exports = (io) => {
    io.on("connection", function (socket) {

        socket.on("identity", function (data) {
            console.log("Identity");
            console.log(data);
            redisClient.hmset(socket.id, "type", "driver", "name", data.name, "id", data.id,"phone",data.phone);
            redisClient.geoadd("drivers", data.location.longitude, data.location.latitude, socket.id);
        });

        socket.on("locationUpdate", function (data) {
            redisClient.geoadd("drivers", data.location.longitude, data.location.latitude, socket.id);
        });

        socket.on("disconnect", () => {
            if (redisClient.exists(socket.id)) {
                redisClient.del(socket.id);
                redisClient.zrem("drivers", socket.id);
            }
        });

        socket.on("request", (data) => {
            redisClient.georadius("drivers", data.requestLocation.longitude, data.requestLocation.latitude, '4', "km", "WITHCOORD", "COUNT", "1", "ASC", function (err, result) {
                var id = result[0][0];
                data.socketId = socket.id;
                io.sockets.connected[id].emit("request", data);
            }); 
        });

        socket.on("accept", data => {

            redisClient.hgetall(socket.id, (error, result) => {
                var driverInfo = {
                    car: data.car,
                    name:result.name,
                    id:result.id,
                    socketId:socket.id,
                    phone:result.phone
                }

                io.sockets.connected[data.socketId].emit("driver:accept",driverInfo);
            });

        });

        socket.on("arrive",data => {
            io.sockets.connected[data.socketId].emit("driver:arrive");
        }) ;

    })
} 