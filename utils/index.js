
var jwt = require('jsonwebtoken');
var rp = require('request-promise');
var geolib = require("geolib");

module.exports = {
    generateToken(data) {
        var token = jwt.sign(data, "cab", {
            expiresIn: 604800000
        });

        return token;
    },
    getEta(origin, destination) {
        var options = {
            method: 'GET',
            uri: 'https://maps.googleapis.com/maps/api/distancematrix/json?origins=' + origin.latitude + "," + origin.longitude + "&destinations=" + destination.latitude + "," + destination.longitude + "&departure_time=now" + "&key=AIzaSyDe_nAWE5ccLGXPuWbcGTXzVlrtH-lMcUw",
            json: true
        };

        return rp(options)
            .then(function (result) {
                var data = result.rows[0].elements[0];
                var distance = data.distance;
                var duration = data.duration.text;
                console.log(duration);
                return duration.substring(0, duration.indexOf(" min"));
            })
            .catch(function (err) {
                console.log(err);
                return err;
            });
    },
    getDirections(origin, destination) {

        var originStr = origin.latitude + "," + origin.longitude;
        var destinationStr = destination.latitude + "," + destination.longitude;

        var options = {
            method: 'GET',
            uri: 'https://maps.googleapis.com/maps/api/directions/json?origin=' + originStr + '&destination=' + destinationStr + '&mode=driving&key=AIzaSyDe_nAWE5ccLGXPuWbcGTXzVlrtH-lMcUw',
            json: true
        };

        function decode(t, e) { for (var n, o, u = 0, l = 0, r = 0, d = [], h = 0, i = 0, a = null, c = Math.pow(10, e || 5); u < t.length;) { a = null, h = 0, i = 0; do a = t.charCodeAt(u++) - 63, i |= (31 & a) << h, h += 5; while (a >= 32); n = 1 & i ? ~(i >> 1) : i >> 1, h = i = 0; do a = t.charCodeAt(u++) - 63, i |= (31 & a) << h, h += 5; while (a >= 32); o = 1 & i ? ~(i >> 1) : i >> 1, l += n, r += o, d.push([l / c, r / c]) } return d = d.map(function (t) { return { latitude: t[0], longitude: t[1] } }) }

        return rp(options)
            .then(function (result) {
                //  console.log(result);
                if (result.routes.length) {
                    var coords = decode(result.routes[0].overview_polyline.points);
                    return coords;
                }
            }).catch(err => {
                console.log(err);
            });
    },
    getDistanceBetween(from, to) {
        return geolib.getDistance(from, to);
    },
    getRealDistanceBetweenInMeters(origin, destination) {
        var options = {
            method: 'GET',
            uri: 'https://maps.googleapis.com/maps/api/distancematrix/json?origins=' + origin.latitude + "," + origin.longitude + "&destinations=" + destination.latitude + "," + destination.longitude + "&departure_time=now" + "&key=AIzaSyDe_nAWE5ccLGXPuWbcGTXzVlrtH-lMcUw",
            json: true
        };

        return rp(options)
            .then(function (result) {
                var data = result.rows[0].elements[0];
                var distance = data.distance.value;
                console.log(distance);
                return distance;
            })
            .catch(function (err) {
                console.log(err);
                return err;
            });
    },
    getTimeInSecondsBetween(origin, destination) {
        var options = {
            method: 'GET',
            uri: 'https://maps.googleapis.com/maps/api/distancematrix/json?origins=' + origin.latitude + "," + origin.longitude + "&destinations=" + destination.latitude + "," + destination.longitude + "&departure_time=now" + "&key=AIzaSyDe_nAWE5ccLGXPuWbcGTXzVlrtH-lMcUw",
            json: true
        };

        return rp(options)
            .then(function (result) {
                var data = result.rows[0].elements[0];
                return data.duration.value;
            })
            .catch(function (err) {
                console.log(err);
                return err;
            });
    },
    getRealDistanceAndTime(origin, destination) {
        var options = {
            method: 'GET',
            uri: 'https://maps.googleapis.com/maps/api/distancematrix/json?origins=' + origin.latitude + "," + origin.longitude + "&destinations=" + destination.latitude + "," + destination.longitude + "&departure_time=now" + "&key=AIzaSyDe_nAWE5ccLGXPuWbcGTXzVlrtH-lMcUw",
            json: true
        };

        return rp(options)
               .then(function (result) {
                var data = result.rows[0].elements[0];
                return [data.distance.value,data.duration.value] ;
               })
               .catch(function (err) {
                   console.log(err);
                   return err;
               });
    },
    calculateFare(tripMin, tripKm) {
  
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

        return totalFare;
    }
};