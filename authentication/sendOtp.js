const axios = require('axios');
require('dotenv').config();

async function sendOtp(val) {
    console.log(val)
    var url = `https://api.textlocal.in/send/?apikey=${process.env.TXT_LCL_API}&numbers=91${val.phone}&sender=600010&message=Hi there, thank you for sending your first test message from Textlocal. Get 20% off today with our code: ${val.otp}`;

    const res = await axios.get(url)

    console.log(res.data)
    return res.data
}

module.exports = sendOtp;