const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    otp: {type: String, required:true, unique:true},
    phone: {type: String, required:true },
    expire: {type: Date, required:true}
},{
    collection: 'otp'
});

const model = mongoose.model('OtpSchema', OtpSchema);

module.exports = model;