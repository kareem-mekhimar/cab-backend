
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PeriodSchema = mongoose.Schema({
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate:{
        type: Date
    },
    driver:{
        type:Schema.Types.ObjectId,
        ref:"driver"
    },
    
});


const Passenger = mongoose.model('period', PassengerSchema);

module.exports = Passenger;