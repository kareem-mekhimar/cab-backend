
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const CarSchema = require("./car");

const DriverSchema = mongoose.Schema({
    firstName: {
        required: [true,"First Name Required"],
        type: String
    },
    lastName: {
        required: [true,"Last name Required"],
        type: String
    },
    gender: {
       type:String,
       enum:['MALE','FEMALE'],
       default:'MALE'
    },
    cars:{
        type : [CarSchema],
        validate:{
            validator : (cars) => {
               if(cars.length <= 0)
                   return false ;
               return true ;
            },
            message: "No Cars Added , Define At least One Car..!"
        }
    },
    address: {
        type: String,
        trim: true,
        required: [true,"Address Required"]
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        validate:{
            validator:(email) => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email),
            message:'Invalid Email Syntax'     
        }
    },
    phone: {
        required:[true,"Phone Required"],
        type:String,
        unique: true,
        trim: true,
        validate:{
            validator:(phone) => /^\d{11}$/.test(phone),
            message:'Invalid Phone No'     
        }
    },
    pin: {
        type: String,
        required: [true,"National No Required"],
        unique: true,
        validate:{
            validator:(pin) => /^\d+$/.test(pin) ,
            message:'Invalid National No'   
        }
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    remarks: {
        type: String
    },
    status: {
        type: String,
        enum: ['NEW', 'HIRED', 'FIRED', 'HOLD'],
        default: 'NEW'
    },
    requestCancelNo:{
        type:Number,
        default: 0
    },
    requestAcceptanceNo:{
        type:Number,
        default:0
    },
    licenceNo:{
        type:String,
        required:[true,"Licence No is Required"]
    },
    licenceExpireDate:{
        type:Date
    },
    online:{
        type:Boolean,
        default:false
    },
    img:{
        type:String,
        // default:"avatar.png"
    },

    currentPeriod:{
        type:Schema.Types.ObjectId,
        ref:"period"
    },
});


const Driver = mongoose.model('driver', DriverSchema);

module.exports = Driver;