var redis = require("redis");

var redisClient = redis.createClient({
    host: "redis-14290.c16.us-east-1-3.ec2.cloud.redislabs.com",
    port: 14290
});


redisClient.on('error', function (error) {
    console.log(error);
});

module.exports = redisClient ;