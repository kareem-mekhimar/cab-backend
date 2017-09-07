const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CarTypeSchema = mongoose.Schema({
    model: {
        type: String,
        required: [true,"Car Model Required"]
    },
    year: {
        type: Number,
        required: [true,"Year Required"]
    },
});

const CarType = mongoose.model('cartype', CarTypeSchema);

module.exports = CarType;