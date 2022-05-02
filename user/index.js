const express = require("express");
const authenticateToken = require("../middleware/authenticate");
const User = require("./model/user");
const Stream = require("../stream/model/stream");
const userApp = express.Router();

userApp.use(express.json());

userApp.get("/", authenticateToken, async (req, res) => {
  const id = req.user.id;

  let val = await User.findOne({ id }).lean();
  const total_streamed = await Stream.countDocuments({ streamer_id: id });
  const total_presented = await Stream.countDocuments({ presenter_id: id });
  delete val.password;
  val.total_streamed = total_streamed;
  val.total_presented = total_presented;
  if (!val) {
    return res.json({ status: "failed", msg: "No user present" });
  }
  console.log(val);

  return res.json({
    status: "ok",
    data: val,
  });
});

userApp.get("/:role", authenticateToken, async (req, res) => {
  try {
    const role = req.params.role;

    const val = await User.find({ role });

    if (!val) {
      return res.json({ status: "failed", msg: "No user present" });
    }

    return res.json({ status: "ok", data: val });
  } catch (e) {
    console.log(e);
    return res.json({ status: "failed", msg: "Server error" });
  }
});

userApp.post("/token/add", authenticateToken, async (req, res) => {
  try {
    const id = req.user.id;
    const token = req.body.token;

    if ((await User.findOne({ id })) == null) {
      return res.json({ status: "failed", msg: "No user present" });
    }

    if (!token) {
      return res.json({ status: "failed", msg: "No token present" });
    }

    await User.updateOne(
      { id },
      {
        $set: {
          token,
        },
      },
      { upsert: false }
    );

    return res.json({ status: "ok", msg: "Updated" });
  } catch (e) {
    console.log(e);
    return res.json({ status: "failed", msg: "Server error" });
  }
});

module.exports = userApp;
