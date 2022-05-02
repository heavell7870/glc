const mongoose = require("mongoose");

const PSchedule = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    webPeekLink: { type: String, required: true },
    tilte: { type: String, required: true },
    glance_id: { type: String, required: true },
    game: { type: String, required: true },
    name_of_the_influencer: { type: String, required: true },
    channel_id: { type: String, required: true },
    duration: { type: String, required: true },
    availablity: { type: Object, required: true },
    status: { type: String, required: true },
    schedule_id: { type: String, required: true },
    created: { type: Date, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    responded: { type: Boolean, required: true },
    responded_at: { type: Date, required: false },
  },
  {
    collection: "schedule",
  }
);

const model = mongoose.model("PSchedule", PSchedule);

module.exports = model;
