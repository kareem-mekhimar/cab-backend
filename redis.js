var redis = require("redis");

//redis-14290.c16.us-east-1-3.ec2.cloud.redislabs.com  - 14290
var redisClient = redis.createClient({
    host: "redis-14290.c16.us-east-1-3.ec2.cloud.redislabs.com",
    port: 14290
});

// var redisClient = redis.createClient({
//     host: "localhost",
//     port: 6379
// });

redisClient.on('error', function (error) {
    console.log(error);
});

module.exports = redisClient ;