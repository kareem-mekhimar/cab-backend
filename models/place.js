const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const PlaceSchema = mongoose.Schema({
    
    name:{
      type: String,
      required:true,
      unique: true,
      trim:true
    },
    location:{
        type: [Number],
        required:true,
        index:'2d'
    }
}) ;

const Place = mongoose.model('place', PlaceSchema);

module.exports = Place;