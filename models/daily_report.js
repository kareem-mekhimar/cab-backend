
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DailyReportSchema = mongoose.Schema({
    dayDate:{
        type:Number,
    },
    driver: {
        type: Schema.Types.ObjectId,
        ref: "driver"
    },

    period: {
        type: Schema.Types.ObjectId,
        ref: "period"
    },
    workingMin: {
        type: Number,
        default: 0
    },

    noOfTrips: {
        type: Number,
        default: 0
    },
    noOfCancelledTrips:{
       type:Number,
       default: 0 
    },
    rating: {
        type: Number,
        default: 0
    }

});


const DailyReport = mongoose.model('daily-report', DailyReportSchema);

module.exports = DailyReport;