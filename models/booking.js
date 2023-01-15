const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    owner: {
        type: String,
        required: true
    },
    bookStatus: {
        default: "pending",
        type: String,
        required: true
    },
    cleaningService: {
        type: String,
        required: true
    },
    cleaningType: {
        type: String,
        required: true
    },
    apartmentType: {
        type: String,
        required: true
    },
    cleaningDate: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: true
    },
    serviceFrequency: {
        type: String,
        required: true
    },
    serviceState: {
        type: String,
        required: true
    },
    serviceLocation: {
        type: String,
        required: true
    },
    notes: {
        type: String,
    }
}, {timestamps: true});

module.exports = mongoose.model('booking', bookingSchema);