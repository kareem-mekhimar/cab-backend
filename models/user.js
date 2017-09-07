
const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const UserSchema = mongoose.Schema({
    userName :{
        type:String,
        required:true,
    },
    userModelType:{
        type:String,
        enum:['ADMIN','DRIVER','PASSENGER'],
        required:true
    },
    password:{
        type:String,
        required:true,
    },
    verified:{
        type:Boolean,
        default : false 
    },
    verificationCode:{
        type:String,
        default:null
    }
}) ;



const User = mongoose.model('user', UserSchema);

module.exports = User;