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
     }
}) ;

const Trip = mongoose.model('trip', TripSchema);

module.exports = Trip;

