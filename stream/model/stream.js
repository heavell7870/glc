const mongoose = require("mongoose");

const PStreamSchema = new mongoose.Schema(
  {
    presenter_id: { type: String, required: true, unique: false },
    stream_data: { type: Object, required: true },
    id: { type: String, required: true, unique: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    added_by: { type: String, required: true },
    stream_id: { type: String, required: true },
    streamer_id: { type: String, required: true, unique: false },
  },
  {
    collection: "stream",
  }
);

const model = mongoose.model("PStreamSchema", PStreamSchema);

module.exports = model;
