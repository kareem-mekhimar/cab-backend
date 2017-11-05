const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const CarType = require("./car_type");

const CarSchema = mongoose.Schema({
    carType:{   
         type:Schema.Types.ObjectId,
         ref:'cartype',
         required:[true,"Specify A valid Car Type"]
    },
    plateNo:{
        type:String,
        required:true
    },
    color:{
        type:String,
        required : true
    },
    luxury:{
        type:Boolean
    }
}) ;

const Car = mongoose.model('car', CarSchema);

module.exports = CarSchema ;