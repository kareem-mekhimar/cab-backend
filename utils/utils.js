
var jwt = require('jsonwebtoken');

module.exports = {
    generateToken(data) {
        var token = jwt.sign(data, "cab", {
            expiresIn : 604800000
        });

        return token;
    },
} ;