var redis = require("redis");

var redisClient = redis.createClient({
    host: "localhost",
    port: 6379
});


redisClient.on('error', function (error) {
    console.log(error);
});

module.exports = redisClient ;