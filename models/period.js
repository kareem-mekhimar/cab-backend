
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PeriodSchema = mongoose.Schema({
    startDate: {
        type: Date
    },
    endDate:{
        type: Date
    },
    driver:{
        type:Schema.Types.ObjectId,
        ref:"driver"
    },

    workingMin:{
        type:Number,
        default:0
    },

    walletTransfer:{
       type:Number,
       default: 0
    },

    noOfTrips:{
        type:Number,
        default:0
    },
    noOfCancelledTrips:{
        type:Number,
        default:0
    },
    granty:{
        type:Number,
        default:0
    },

    offers:{
        type:Number,
        default:0
    },
    finished:{
        type:Boolean,
        default:false
    },
    totalFare:{
        type:Number,
        default:0
    }
    
});


const Period = mongoose.model('period', PeriodSchema);

module.exports = Period;