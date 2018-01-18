
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PassengerSchema = mongoose.Schema({
    fullName: {
        required: [true, "Name Required"],
        type: String
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: (email) => {
                if (!email)
                    return true;
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
            },
            message: 'Invalid Email Syntax'
        }
    },
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE'],
        default: 'MALE'
    },
    phone: {
        required: [true, "Phone Required"],
        type: String,
        unique: true,
        trim: true,
        validate: {
            validator: (phone) => /^\d{11}$/.test(phone),
            message: 'Invalid Phone No'
        }
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    wallet:{
        type: Number,
        default:0
    },
    rate:{
        type:Number,
        default: 0
    }
});


const Passenger = mongoose.model('passenger', PassengerSchema);

module.exports = Passenger;