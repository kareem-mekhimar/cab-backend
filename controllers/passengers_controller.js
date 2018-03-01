const Passenger = require("../models/passenger");
const DailyReport = require("../models/daily_report") ;
const Driver = require("../models/driver") ;
const userController = require("./user_controller");
const generatePassword = require('password-generator');
const Trip = require("../models/trip") ;
const moment = require("moment") ;

const { calculateFare, getRealDistanceBetweenInMeters, getTimeInSecondsBetween, getRealDistanceAndTime } = require("../utils");

module.exports = {

    findAll(req, res) {
        res.contentType("application/json");

        var limit = 20;
        var pageParam = req.param('page');

        var page = pageParam && pageParam > 0 ? pageParam : 1;

        Passenger.find({})
            .sort({ joinDate: -1 })
            .limit(limit)
            .skip((page - 1) * limit).then(data => {
                Passenger.count().then(count => {
                    res.send({
                        page: page,
                        limit: limit,
                        pageCount: Math.ceil(count / limit),
                        total: count,
                        data: data
                    });
                });
            });
    },


    create(req, res) {
        const passengerBody = req.body;

        const newPassenger = {
            fullName: passengerBody.fullName,
            gender: passengerBody.gender,
            phone: passengerBody.phone
        };

        var email = passengerBody.email;
        if (email)
            newPassenger.email = email;

        res.contentType("application/json");

        Passenger.create(newPassenger).then(passenger => {

            return userController.createNewPassengerUser(passenger, passengerBody.password).then(user => {
                res.status(201).send(user);
            });

        }).catch(model => {
            console.log(model);
            res.status(422).send(model.errors);
        });
    },

    findById(req, res) {
        res.contentType("application/json");

        var id = req.params.id;

        Passenger.findById(id).then(passenger => {
            if (!passenger)
                res.status(404).end();
            else
                res.status(200).send(passenger);
        }).catch(err => {
            res.status(404).end();
        });
    },

    update(req, res) {
        const passengerBody = req.body;

        var id = req.params.id;
        res.contentType("application/json");

        Passenger.findByIdAndUpdate(id, passengerBody, { new: true }).then(passenger => {
            res.status(200).send(driver);
        }).catch(err => {
            res.status(404).end();
        });
    },

    isPhoneExists(req, res) {
        const phoneParam = req.query.phone;
        if (!phoneParam)
            res.status(400).send({ error: 'Phone is Required' });
        else {

            Passenger.findOne({ phone: phoneParam }).then(passenger => {
                if (passenger)
                    res.status(200).send({ exists: true });
                else
                    res.status(200).send({ exists: false });
            }).catch(err => {
                res.status(500).send(err);
            });
        }
    },

    isEmailExists(req, res) {
        const emailParam = req.query.email;
        if (!emailParam)
            res.status(400).send({ error: 'Email is Required' });
        else {

            Passenger.findOne({ email: emailParam }).then(passenger => {
                if (driver)
                    res.status(200).send({ exists: true });
                else
                    res.status(200).send({ exists: false });
            }).catch(err => {
                res.status(500).send(err);
            });
        }
    },
    sendCode(req, res) {
        return userController.generatePassengerCode(req.params.id).then(() => {
            console.log("hererre");
            res.status(200).end();
        });
    },
    verify(req, res) {
        var id = req.params.id;
        var code = req.body.code;

        userController.verifyPassengerUser(id, code).then(result => {
            if (result) {
                res.status(200).end();
            } else {
                res.status(400).send({ error: "Invalid Code" });
            }
        }).catch(error => console.log(error));
    },
    calculateDistanceAndFare(req, res) {

        var origin = req.body.origin;
        var destination = req.body.destination;

        getRealDistanceAndTime(origin, destination).then(r => {

            let distance = parseFloat(r[0]) / 1000;;
            let timeMin = r[1] / 60;


            console.log(distance) ;
            console.log(timeMin) ;
            
            let fare = calculateFare(timeMin, distance);

            res.send({
                fare: fare,
                distance: distance
            });
        });


    },
    saveRate(req,res,next){
        let id = req.params.id ;
        let rate = req.body.rate;

        Passenger.findById(id).then(passenger => {
            if(!passenger)
               res.status(404).send({ error:'Passenger with id not found' }) ;
            else{
                Trip.find({ passenger:id }).sort({ endDate : -1 }).limit(1).then(trip => {

                    trip[0].rate = rate ;
                    trip[0].save() ; 


                    Driver.findById(trip[0].driver).then(driver => {

                        let nowMoment = moment().startOf('day');
                        DailyReport.findOne({
                            dayDate: nowMoment.toDate(),
                            driver: driver._id,
                            period: driver.currentPeriod
                        }).then(report => {

                            report.rate += rate;
                            report.save();

                        });


                    });
                });

                res.status(204).end() ;
            }   
        })
    }

}