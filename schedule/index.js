const express = require("express");
const authenticateToken = require("../middleware/authenticate");
const Schedule = require("./model");
const User = require("../user/model/user");
// var nodemailer = require("nodemailer");
// const { getIcalObjectInstance } = require("./helper");
// const { sendemail } = require("./sendMail");
// const { default: axios } = require("axios");
const { Expo } = require("expo-server-sdk");

const expo = new Expo();
const scheduleApp = express.Router();

scheduleApp.use(express.json());

scheduleApp.post("/", authenticateToken, async (req, res) => {
  const {
    schedule_id,
    startTime,
    endTime,
    description,
    tilte,
    glance_id,
    game,
    name_of_the_influencer,
    channel_id,
    duration,
    availablity,
    from,
    to,
  } = req.body;

  if (
    (await Schedule.findOne({ id: schedule_id + "-" + channel_id })) != null
  ) {
    return res.json({ status: "failed", msg: "Already scheduled" });
  }

  await Schedule.updateMany(
    { channel_id, game, status: "active" },
    {
      $set: {
        status: "inactive",
      },
    },
    { upsert: false }
  );

  try {
    await Schedule.create({
      id: schedule_id + "-" + channel_id + "-" + game,
      startTime: startTime,
      endTime: endTime,
      description,
      tilte,
      schedule_id,
      glance_id,
      game,
      name_of_the_influencer,
      channel_id,
      duration,
      availablity,
      from,
      to,
      status: "active",
      created: new Date(),
      responded: false,
    });

    let messages = [];

    const streamer = await User.findOne({ channel_id }).lean();
    console.log(streamer);

    if (!Expo.isExpoPushToken(streamer.token)) {
      console.error(
        `Push token ${streamer.token} is not a valid Expo push token`
      );
    } else {
      messages.push({
        to: streamer.token,
        sound: "default",
        body: `${streamer.username} please respond on latest schedule`,
        title: "Schedule Updated 📆",
        //data: { url: `https://myaroundly.com/post/${post_id}` },
      });
    }

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    (async () => {
      for (let chunk of chunks) {
        try {
          let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          console.log(ticketChunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error(error);
        }
      }
    })();

    const newSchedule = await Schedule.find({ schedule_id })
      .sort({ created: -1 })
      .lean();
    return res.json({
      status: "ok",
      msg: "Successfully updated",
      data: newSchedule,
    });
  } catch (error) {
    console.log(error);
    return res.json({ status: "failed", msg: "Server error" });
  }
});

scheduleApp.get("/:id", authenticateToken, async (req, res) => {
  try {
    const schedule_id = req.params.id;
    const data = await Schedule.find({ schedule_id })
      .sort({ created: -1 })
      .lean();
    return res.json({ status: "ok", data });
  } catch (error) {
    console.log(error);
    return res.json({ status: "ok", msg: "Server error" });
  }
});

scheduleApp.get("/channel/:id", authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
    const data = await Schedule.find({ channel_id: id, status: "active" })
      .sort({ created: -1 })
      .lean();
    return res.json({ status: "ok", data });
  } catch (error) {
    console.log(error);
    return res.json({ status: "ok", msg: "Server error" });
  }
});

scheduleApp.get("/stream/my", authenticateToken, async (req, res) => {
  const id = req.user.id;
  try {
    const data = await Schedule.find({ channel_id: id })
      .sort({ created: -1 })
      .lean();
    return res.json({ status: "ok", data });
  } catch (error) {
    console.log(error);
    return res.json({ status: "ok", msg: "Server error" });
  }
});

scheduleApp.post("/stream/respond", authenticateToken, async (req, res) => {
  const { data, id, name } = req.body;
  try {
    await Schedule.updateOne(
      { id },
      {
        $set: {
          availablity: data,
          responded: true,
          responded_at: new Date(),
        },
      },
      { upsert: false }
    );

    let messages = [];

    const presenter = await User.find({ role: "presenter" }).lean();
    console.log(presenter);

    presenter.forEach((item) => {
      if (!Expo.isExpoPushToken(item.token)) {
        console.error(
          `Push token ${item.token} is not a valid Expo push token`
        );
      } else {
        messages.push({
          to: item.token,
          sound: "default",
          body: `${name} responded on latest schedule`,
          title: "One Response 📆",
          //data: { url: `https://myaroundly.com/post/${post_id}` },
        });
      }
    });

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    (async () => {
      for (let chunk of chunks) {
        try {
          let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          console.log(ticketChunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error(error);
        }
      }
    })();

    return res.json({ status: "ok", msg: "Updated" });
  } catch (error) {
    console.log(error);
    return res.json({ status: "ok", msg: "Server error" });
  }
});

scheduleApp.get("/", async (req, res) => {
  try {
    const data = await Schedule.find({ status: "active" }).sort({
      created: -1,
    });

    const arr = [];

    data.forEach((item) => {
      arr.push(item.schedule_id);
    });
    function uniq(a) {
      return a.sort().filter(function (item, pos, ary) {
        return !pos || item != ary[pos - 1];
      });
    }
    return res.json({ status: "ok", data: uniq(arr) });
  } catch (error) {
    console.log(error);
    return res.json({ status: "ok", msg: "Server error" });
  }
});

module.exports = scheduleApp;
