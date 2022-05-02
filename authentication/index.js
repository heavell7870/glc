const express = require("express");
const User = require("./model/user.js");
const Otp = require("./model/otp.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authenticateToken = require("../middleware/authenticate.js");
const generateAccessToken = require("./authToken/tokens.js");
const sendOtp = require("./sendOtp.js");
require("dotenv").config();

const authApp = express.Router();

authApp.use(express.json());

authApp.post("/register", async (req, res) => {
  const {
    username,
    password: plainTextPassword,
    email,
    phone,
    type,
    role,
    channel_id,
  } = req.body;

  if (!username || typeof username !== "string") {
    return res.json({ status: "failed", msg: "Invalid Username" });
  }

  if (!role || typeof role !== "string") {
    return res.json({ status: "failed", msg: "Invalid Role" });
  }

  if (!email || typeof email !== "string") {
    return res.json({ status: "failed", msg: "Invalid Email" });
  }

  if (!phone || typeof phone !== "string" || phone.length != 10) {
    return res.json({ status: "failed", msg: "Invalid Mobile Number" });
  }

  if (!plainTextPassword || typeof plainTextPassword !== "string") {
    return res.json({ status: "failed", msg: "Invaild Password" });
  }

  if (plainTextPassword.length < 6) {
    return res.json({ status: "failed", msg: "Password too small." });
  }

  if (!type || typeof type !== "string") {
    return res.json({ status: "failed", msg: "Type is missing" });
  }

  if ((await User.findOne({ username }).lean()) !== null) {
    return res.json({ status: "failed", msg: "Username already exists" });
  }

  if ((await User.findOne({ phone }).lean()) !== null) {
    return res.json({ status: "failed", msg: "Mobile number already exists" });
  }

  if (email.length != 0 && (await User.findOne({ email }).lean()) !== null) {
    return res.json({ status: "failed", msg: "Email already exists" });
  }

  const password = await bcrypt.hash(plainTextPassword, 10);

  try {
    await User.create({
      username,
      password,
      email,
      id:
        channel_id && channel_id?.length > 0
          ? channel_id
          : `GLC${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
      created: new Date(),
      phone,
      updated: new Date(),
      is_verified: false,
      channel_id,
      role,
      type,
    });

    const user = await User.findOne({ username }).lean();

    const access_token = generateAccessToken({
      id: user.id,
      username: user.username,
      type: user.type,
    });
    const refresh_token = jwt.sign(
      { id: user.id, username: user.username, type: user.type },
      process.env.REFRESH_TOKEN_SECRET
    );
    return res.json({
      status: "ok",
      msg: "Registration Successfull",
      data: { access_token, refresh_token, type: user.type },
    });
  } catch (e) {
    if (e.code === 11000) {
      return res.json({ status: "failed", msg: "User already exists" });
    }
    return res.json({ status: "failed", msg: "Server error" });
  }
});

authApp.post("/login", async (req, res) => {
  const { username, password: plainTextPassword } = req.body;

  if (!username || typeof username !== "string") {
    return res.json({ status: "failed", msg: "Invalid Username" });
  }

  if (!plainTextPassword || typeof plainTextPassword !== "string") {
    return res.json({ status: "failed", msg: "Invaild Password" });
  }

  const user = await User.findOne({ username }).lean();

  if (!user) {
    return res.json({ status: "failed", msg: "Invalid Username or password" });
  }

  if (await bcrypt.compare(plainTextPassword, user.password)) {
    const access_token = generateAccessToken({
      id: user.id,
      username: user.username,
      type: user.type,
    });
    const refresh_token = jwt.sign(
      { id: user.id, username: user.username, type: user.type },
      process.env.REFRESH_TOKEN_SECRET
    );
    return res.json({
      status: "ok",
      data: { access_token, refresh_token, type: user.type },
    });
  }

  return res.json({ status: "failed", msg: "Invalid Username or password" });
});

authApp.post("/login_admin", async (req, res) => {
  const { phone, password: plainTextPassword } = req.body;

  if (!phone || typeof phone !== "string") {
    return res.json({ status: "failed", msg: "Invalid Mobile number" });
  }

  if (!plainTextPassword || typeof plainTextPassword !== "string") {
    return res.json({ status: "failed", msg: "Invaild Password" });
  }

  const user = await User.findOne({ phone }).lean();

  if (!user) {
    return res.json({ status: "failed", msg: "Invalid Username or password" });
  }

  if (user.type == "user") {
    return res.json({
      status: "failed",
      msg: "Only admin and moderator can access",
    });
  }

  if (await bcrypt.compare(plainTextPassword, user.password)) {
    // const accesToken = jwt.sign({id: user.id, username: user.username}, process.env.ACCESS_TOKEN_SECRET)
    // return res.json({status:'ok', data:{accesToken}})
    const access_token = generateAccessToken({
      id: user.id,
      username: user.username,
      type: user.type,
    });
    const refresh_token = jwt.sign(
      { id: user.id, username: user.username, type: user.type },
      process.env.REFRESH_TOKEN_SECRET
    );
    return res.json({
      status: "ok",
      data: { access_token, refresh_token, type: user.type },
    });
  }

  return res.json({ status: "failed", msg: "Invalid Username or password" });
});

authApp.post("/verify", async (req, res) => {
  const { otp, phone } = req.body;

  if (!otp || typeof otp !== "string") {
    return res.json({ status: "failed", msg: "Missing OTP" });
  }

  if (!phone || typeof phone !== "string") {
    return res.json({ status: "failed", msg: "Missing mobile number" });
  }

  const val = await Otp.findOne({ phone });

  if (val == null) {
    return res.json({ status: "failed", msg: "Invalid request" });
  }

  if (val.otp == otp && val.expire.getTime() > new Date().getTime()) {
    try {
      await User.updateOne(
        { phone },
        {
          is_verified: true,
        }
      );
    } catch (err) {
      console.log(err);
      return res.json({ status: "failed", msg: "Server error" });
    }
    return res.json({ status: "ok", msg: "Verification succesfull" });
  }

  return res.json({ status: "failed", msg: "OTP expired, please try again" });
});

authApp.get("/checkToken", authenticateToken, (req, res) => {
  req.user;
  return res.json({ status: "ok", msg: "Verified", user: req.user });
});

authApp.post("/refresh", (req, res) => {
  const { refresh_token } = req.body;

  if (refresh_token == null) {
    return res.json({ status: "failed", msg: "Refresh token not present" });
  }

  jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.json({ status: "failed", msg: "Invalid token" });
    }
    const access_token = generateAccessToken({
      id: user.id,
      username: user.username,
      type: user.type,
    });
    return res.json({
      status: "ok",
      msg: "Token Generated",
      access_token,
      type: user.type,
    });
  });
});

authApp.post("/resend", async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.json({ status: "failed", msg: "Mobile number not present" });
  }

  const val = await Otp.findOne({ phone });

  if (val == null) {
    return res.json({
      status: "failed",
      msg: "An error occured, Please try again",
    });
  }
  sendOtp({ phone, otp: val.otp });
  try {
    await Otp.updateOne(
      { phone },
      {
        expire: new Date(Date.now() + 10 * 60 * 1000),
      }
    );
  } catch (e) {
    console.log(e);
    return res.json({
      status: "failed",
      msg: "An error occured, Please try again",
    });
  }

  return res.json({ status: "ok", msg: "OTP sent succesfully" });
});

module.exports = authApp;
