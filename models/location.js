const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LocationSchema = mongoose.Schema({
    latitude:{
        type:Number
    },
    longitude:{
        type:Number
    }
}) ;


module.exports = LocationSchema ;