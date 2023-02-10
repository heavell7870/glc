const express = require("express");
const authenticateToken = require("../middleware/authenticate");
const Stream = require("./model/stream");
const User = require("../user/model/user");
var nodemailer = require("nodemailer");
const { getIcalObjectInstance } = require("./helper");
const { sendemail } = require("./sendMail");
const { default: axios } = require("axios");

var smtpTransport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "glance.live.game@gmail.com",
    pass: "ziylgxcrsxxhigct",
  },
});

var mailOptions = {
  to: "heavell78@gmail.com",
  subject: "This is a test email from a developer",
  html: "<h1>Welcome to my website</h1>",
};

const streamApp = express.Router();

streamApp.use(express.json());

streamApp.get("/:id", authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
    const data = await Stream.findOne({ id });
    if (data) {
      return res.json({ status: "ok", data, exist: true });
    }
    return res.json({ status: "failed", exist: false });
  } catch (e) {
    console.log(e);
    return res.json({ status: "failed", msg: "Server error", e });
  }
});

streamApp.get("/presenter", authenticateToken, async (req, res) => {
  const id = req.user.id;
  try {
    const data = await Stream.find({ presenter_id: id }).lean();
    return res.json({ status: "ok", data, exist: true });
  } catch (e) {
    console.log(e);
    return res.json({ status: "failed", msg: "Server error", e });
  }
});

streamApp.get("/streamer", authenticateToken, async (req, res) => {
  const id = req.user.id;
  try {
    const data = await Stream.find({ streamer_id: id }).lean();
    return res.json({ status: "ok", data, exist: true });
  } catch (e) {
    console.log(e);
    return res.json({ status: "failed", msg: "Server error", e });
  }
});

streamApp.post("/test", async (req, res) => {
  smtpTransport.sendMail(mailOptions, function (error, response) {
    if (error) {
      console.log(error);
    } else {
      console.log("Message sent: ", response);
    }
  });
  return res.json({ done: true });
});

streamApp.post("/", authenticateToken, async (req, res) => {
  const id = req.user.id;
  const { presenter_id, stream_data, time, streamer_id, stream_id } = req.body;

  if (!presenter_id || typeof presenter_id != "string") {
    return res.json({
      status: "failed",
      msg: "Presenter id is invalid or missing",
    });
  }
  if (!stream_data) {
    return res.json({ status: "failed", msg: "Data is invalid or missing" });
  }
  if (!time) {
    return res.json({ status: "failed", msg: "Time is invalid or missing" });
  }
  if (!streamer_id || typeof streamer_id != "string") {
    return res.json({
      status: "failed",
      msg: "Streamer id is invalid or missing",
    });
  }

  if (!stream_id || typeof stream_id != "string") {
    return res.json({
      status: "failed",
      msg: "Stream id is invalid or missing",
    });
  }

  try {
    var d = new Date(time);
    let startTime = new Date(time);
    let ms = stream_data.durationInSeconds;
    d = new Date(d.getTime() + ms * 1000);
    let summary = stream_data.title + " " + "has been assigned to you.";
    let dec = stream_data.title + " " + "has been assigned to you.";

    const is_exist = await Stream.findOne({ stream_id });

    if (is_exist) {
      return res.json({
        status: "failed",
        msg: "Stream is already assigned",
      });
    }

    const presenter = await User.findOne({ id: presenter_id });
    const streamer = await User.findOne({ id: streamer_id });

    if (!presenter) {
      return res.json({
        status: "failed",
        msg: "Presenter doesn't exists",
      });
    }
    if (!streamer) {
      return res.json({
        status: "failed",
        msg: "Streamer doesn't exists",
      });
    }

    await Stream.create({
      presenter_id,
      stream_data,
      startTime,
      endTime: d,
      streamer_id,
      added_by: id,
      stream_id,
      id: `GLS${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
    });
    const obj = await getIcalObjectInstance(
      startTime,
      d,
      summary,
      dec,
      "Bengaluru"
    );
    sendemail(
      presenter.email,
      "Invitation to present the stream",
      "<p>Hello, Please respond to this link to be updated for your upcoming stream</p>",
      obj
    );
    sendemail(
      streamer.email,
      "Invitation to stream on Glance",
      "<p>Hello, Please respond to this link to be updated for your upcoming stream</p>",
      obj
    );
    return res.json({ status: "ok", msg: "Added successfully" });
  } catch (e) {
    console.log(e);
    return res.json({ status: "failed", msg: "Server error", e });
  }
});

streamApp.get("/upcoming/data", async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://cdn.live.glance.com/v2/public-shows/summary"
    );
    return res.json({ data, status: "ok" });
  } catch (error) {
    console.log(error);
    return res.json({ msg: "Internal error", status: "failed" });
  }
});

streamApp.get("/live/data", async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://cdn.live.glance.com/v2/public-shows/summary"
    );
    const arr = [];
    if (data.today) {
      data.today.forEach((item) => {
        if (item.meta.source === "gaming") {
          var start_time = new Date(item.startTime);
          var current_time = new Date();
          var end_time = new Date(item.startTime);
          end_time = new Date(
            end_time.getTime() + item.durationInSeconds * 1000
          );
          if (start_time < current_time && end_time > current_time) {
            arr.push(item);
          }
        }
      });
    }
    return res.status(200).json({ data: arr, status: "ok" });
  } catch (error) {
    console.log(error);
    return res.json({ msg: "Internal error", status: "failed" });
  }
});
module.exports = streamApp;
