const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const customerSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    loginCounter: {
        default: 0,
        type: Number,
        required: true
    },
    loginCounterExp: {
        type: Date
    },
    verificationCode: {
        type: String
    },
    verificationExp: {
        type: Date,
        required: true
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExp: {
        type: Date
    },
    status: {
        default: 'not-verified',
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
}, {timestamps: true});

module.exports = mongoose.model('customer', customerSchema);