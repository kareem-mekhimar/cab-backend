const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const LocationSchema = require("./location") ;

const TripSchema = mongoose.Schema({
     passenger:{
        type:Schema.Types.ObjectId,
        ref:'passenger',
     },
     driver:{
        type:Schema.Types.ObjectId,
        ref:'driver',
     },
     fare:{
         type:Number
     },
     km:{
         type:Number
     },
     min:{
         type:Number
     },
     arriveDate:{
         type:Date
     },
     startDate:{
         type:Date
     },
     endDate:{
         type:Date
     },
     waitingTime:{
        type:Number
     },
     requestLocation:{
        type: [Number],
        index:'2d'
     },
     requestLocationName:{
        type:String
     },
     dropOffLocation:{
        type: [Number],
        index:'2d'
     },
     dropOffLocationName:{
         type:String
     },
     path:{
         type:[LocationSchema]
     },
     period:{
        type:Schema.Types.ObjectId,
        ref:"period"
     },
     onhand:{
        type:Number
     },
     rate:{
         type:Number,
         default:0
     }
}) ;

const Trip = mongoose.model('trip', TripSchema);

module.exports = Trip;

