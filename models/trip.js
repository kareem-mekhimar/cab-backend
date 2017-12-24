const mongoose = require("mongoose");
const Schema = mongoose.Schema;


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
     time:{
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
     requestLocation:{
        type: [Number],
        index:'2d'
     },
     dropOffLocation:{
        type: [Number],
        index:'2d'
     }
}) ;

const Trip = mongoose.model('trip', TripSchema);

module.exports = Trip;

