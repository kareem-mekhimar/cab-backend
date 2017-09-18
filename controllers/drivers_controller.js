const Driver = require("../models/driver");
const redisClient = require("../redis");
const userController = require("./user_controller");
const getEta  = require("../utils/utils").getEta;
var path = require("path");
var multer = require("multer");

var upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'imgs/')
        },
        filename: function (req, file, cb) {
            cb(null, req.params.id)
        }
    })
}).single('img');

module.exports = {

    findAll(req, res) {
        res.contentType("application/json");

        var limit = 20;
        var pageParam = req.param('page');

        var page = pageParam && pageParam > 0 ? pageParam : 1;

        Driver.find({})
            .populate('cars.carType')
            .sort({ joinDate: -1 })
            .limit(limit)
            .skip((page - 1) * limit).then(data => {
                Driver.count().then(count => {
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
        const driverBody = req.body;

        res.contentType("application/json");

        Driver.create(driverBody).then(driver => {
            res.status(201).send(driver);

            userController.createNewDriverUser(driver._id, driver.phone);

        }).catch(model => {
            res.status(422).send(model.errors);
        });
    },

    findById(req, res) {
        res.contentType("application/json");

        var id = req.params.id;

        Driver.findById(id).populate('cars.carType').then(driver => {
            if (!driver)
                res.status(404).end();
            else
                res.status(200).send(driver);
        }).catch(err => {
            res.status(404).end();
        });
    },

    update(req, res) {
        const driverBody = req.body;

        var id = req.params.id;
        res.contentType("application/json");

        Driver.findByIdAndUpdate(id, driverBody, { new: true }).then(driver => {
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

            Driver.findOne({ phone: phoneParam }).then(driver => {
                if (driver)
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

            Driver.findOne({ email: emailParam }).then(driver => {
                if (driver)
                    res.status(200).send({ exists: true });
                else
                    res.status(200).send({ exists: false });
            }).catch(err => {
                res.status(500).send(err);
            });
        }
    },

    verify(req, res) {
        var id = req.params.id;
        var password = req.body.password;

        Driver.update({ _id: id }, { status: "HIRED" }).then(driver => {
            userController.verifyDriverUser(id, password).then(user => {
                res.status(200).end();
            });
        });
    },
    uploadImg(req, res) {
        upload(req, res, function (err) {
            if (err) {
                console.log(err);
                return res.status(400).send("an Error occured")
            }
            var id = req.params.id;
            Driver.update({ _id: id }, { img: id }).then(driver => {
                res.status(204).end();
            });

        });
    },
    findImg(req, res) {
        var id = req.params.id;
        Driver.findById(id).then(driver => {
            res.sendFile(path.join(__dirname, "../imgs/avatar.png"));
        });
    },
    findNear(req, res) {
        var lat = req.query.lat;
        var lng = req.query.lng;
        console.log(lat + ",," + lng);
        redisClient.georadius("drivers-free", lng, lat, '4', "km", "WITHCOORD", "COUNT", "12", "ASC", function (err, result) {

            if (result.length === 0) {
                res.send({ msg: "No Drivers Near You" });
                return;
            }
         
            var nearestLocation = null;
            var driversLocations = [];

            result.map((r, index) => {
                var id = r[0][0]
                var longitude = r[1][0];
                var latitude = r[1][1];
                var pos = { latitude, longitude, id };
                if (index === 0) {
                    nearestLocation = pos;
                }
                driversLocations.push(pos);
            });

            var options = {
                method: 'GET',
                uri: 'https://maps.googleapis.com/maps/api/distancematrix/json?origins=' + nearestLocation.latitude + "," + nearestLocation.longitude + "&destinations=" + lat + "," + lng + "&departure_time=now" + "&key=AIzaSyDe_nAWE5ccLGXPuWbcGTXzVlrtH-lMcUw",
                json: true
            };
             
            var destination = {
                latitude:lat,
                longitude:lng
            } ;

            getEta(nearestLocation,destination).then(result => {
                res.send({
                    drivers: driversLocations,
                    nearTime: result
                });
            })

        });


    }
}