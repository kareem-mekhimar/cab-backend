const expressValidator = require('express-validator');
const User = require("../models/user");
const generatePassword = require('password-generator');
const generateToken = require("../utils/utils").generateToken;

var twilio = require('twilio');


module.exports = {

    createNewDriverUser(id, phoneNo) {
        var password = generatePassword(4, false, /\d/);
        var newDriver = new User({
            userName: phoneNo,
            password: password,
            userModelType: 'DRIVER',
            _id: id,
        });

        newDriver.save().then(user => {

            var client = new twilio("ACf118dffe7bd8e0b3cb9cbf6ac4fd8dd9", "088a74c77d2105a4d1671f556bea0cee");
            client.messages.create({
                body: 'CAB Password => ' + password,
                to: '+2' + phoneNo,
                from: '+16672220104'
            }).then((message) => console.log(message.sid));
        });
    },

    createNewPassengerUser(passenger, password) {

        var newPassenger = new User({
            userName: passenger.phone,
            password: password,
            userModelType: 'PASSENGER',
            _id: passenger._id,
        });

        return newPassenger.save().then(user => {
            var id = user._id;
            var type = user.userModelType;
            var dataToSign = { id, type };
            var verified = user.verified;

            var token = generateToken(dataToSign);

            return { id, type, token, verified } ;
        }).catch(error => console.log(error));
    },

    createNewAdminUser(req, res) {
        res.contentType("application/json");

        var body = req.body;

        req.checkBody('userName', 'Required').notEmpty();
        req.checkBody('password', 'Required').notEmpty();

        var errors = req.validationErrors();

        if (errors) {
            res.status(400).send({ "error": errors });
            return;
        } else {

            var userName = req.body.userName;
            var password = req.body.password;

            User.findOne({ userName: userName, userModelType: "ADMIN" }).then(user => {

                if (user)
                    res.status(409).send({ error: userName + " already exists" });
                else {
                    User.create({ userName: userName, password: password, userModelType: "ADMIN" }).then(user => {
                        res.status(201).end();
                    });
                }

            });
        }
    },

    authenticate(req, res) {

        res.contentType("application/json");

        var body = req.body;
        req.checkBody('userName', 'Required').notEmpty();
        req.checkBody('password', 'Required').notEmpty();
        
        var errors = req.validationErrors();

        if (errors) {
            res.status(400).send({ "error": errors });
            return;
        } else {
            User.findOne({ userName: req.body.userName, password: req.body.password })
                .then(user => {
                    if (!user) {
                        res.status(401).send({ error: 'Wrong User name / Password' });
                    }
                    else {
                        var id = user._id;
                        var type = user.userModelType;
                        var dataToSign = { id, type };
                        var verified = user.verified;

                        var token = generateToken(dataToSign);

                        res.status(200).send({ id, type, token, verified });
                    }
                });
        }

    },
    generatePassengerCode(id) {
        var code = generatePassword(4, false, /\d/);
        return User.findByIdAndUpdate(id, { verificationCode: code }, { new: true }).then(user => {
            var client = new twilio("ACf118dffe7bd8e0b3cb9cbf6ac4fd8dd9", "088a74c77d2105a4d1671f556bea0cee");
            client.messages.create({
                body: 'CAB Code => ' + code,
                to: '+2' + user.userName,
                from: '+16672220104'
            }).then((message) => console.log(message.sid))
            .catch(error => console.log(error));
        })
    },
    verifyDriverUser(id, password) {
        return User.update({ _id: id }, { password: password, verified: true });
    },
    verifyPassengerUser(id, code) {
        return User.findById(id).then(user => {
            if (user.verificationCode === code) {
                user.verified = true ;

                return user.save().then(user => {
                    console.log(user);
                    return true ;
                });
            }
            else
                return false;

        });
    }
};