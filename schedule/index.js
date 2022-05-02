const express = require("express");
const authenticateToken = require("../middleware/authenticate");
const Schedule = require("./model");
const User = require("../user/model/user");
// var nodemailer = require("nodemailer");
// const { getIcalObjectInstance } = require("./helper");
// const { sendemail } = require("./sendMail");
// const { default: axios } = require("axios");

const scheduleApp = express.Router();

scheduleApp.use(express.json());

scheduleApp.post("/", authenticateToken, async (req, res) => {
  const {
    schedule_id,
    startTime,
    endTime,
    webPeekLink,
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
      webPeekLink,
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
  const { data, id } = req.body;
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
    return res.json({ status: "ok", msg: "Updated" });
  } catch (error) {
    console.log(error);
    return res.json({ status: "ok", msg: "Server error" });
  }
});

scheduleApp.get("/", async (req, res) => {
  try {
    const data = await Schedule.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$schedule_id",
          id: { $first: "$id" },
          startTime: { $first: "$startTime" },
          endTime: { $first: "$endTime" },
          webPeekLink: { $first: "$webPeekLink" },
          title: { $first: "$title" },
          schedule_id: { $first: "$schedule_id" },
          glance_id: { $first: "$glance_id" },
          game: { $first: "$game" },
          name_of_the_influencer: { $first: "$name_of_the_influencer" },
          duration: { $first: "$duration" },
          availablity: { $first: "$availablity" },
          from: { $first: "$from" },
          to: { $first: "$to" },
          status: { $first: "$status" },
          created: { $first: "$created" },
          responded: { $first: "$responded" },
          responded_at: { $first: "$responded_at" },
        },
      },
    ]);
    return res.json({ status: "ok", data });
  } catch (error) {
    console.log(error);
    return res.json({ status: "ok", msg: "Server error" });
  }
});

module.exports = scheduleApp;
