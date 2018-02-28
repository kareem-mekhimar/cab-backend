
const express = require("express");
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require("path");
const eventsHandler = require("./events_handler") ;
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const expressValidator = require('express-validator');
var jwt = require('jsonwebtoken');
const { swaggerSpec } = require("./services/swagger") ;


const userRoutes = require("./routes/user_routes");
const userController = require("./controllers/user_controller");
const driverRoutes = require("./routes/driver_routes");
const passengerRoutes = require("./routes/passenger_routes");
const carTypesRoute = require("./routes/car_types_routes");
const placesRoute = require("./routes/places.routes");


var moment = require("moment") ;

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://admin:admin@ds119302.mlab.com:19302/cab');
//mongoose.connect('mongodb://localhost/taxi') ;


app.use(cors());

app.get('/swagger.json', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/docs', express.static(path.join(__dirname, 'docs')));

app.use('/', function (req, res, next) {
    var contype = req.headers['content-type'];
    if ( contype.indexOf('application/json') !== 0 && contype.indexOf('multipart/form-data;') !== 0)
        return res.status(415).send({ error: "Unsupported Media Type (" + contype + ")" });
    next();
});


    
app.use(function (err, req, res, next) {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).send({ error: 'Bad JSON syntax' });
    }
    next();
});


app.use('/imgs', express.static(path.join(__dirname,'imgs')));

app.get("/drivers",(req,res) => {
   res.sendFile(path.join(__dirname,"/index.html"));
});


let now = moment().startOf('day') ;
console.log(now.toDate()) ;
console.log(now.add(14, 'days').toDate()) ;


app.use(expressValidator());

app.post("/auth",userController.authenticate);

const router = express.Router();


userRoutes(router);
passengerRoutes(router);
driverRoutes(router);
carTypesRoute(router);
placesRoute(router);

app.use("/api", router);

eventsHandler(io) ;

module.exports = http;