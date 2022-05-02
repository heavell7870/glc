const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    created: { type: Date, required: true },
    email: { type: String, required: false, unique: true },
    phone: { type: String, required: true, unique: true },
    updated: { type: Date, required: true },
    is_verified: { type: Boolean, required: true },
    type: { type: String, required: true },
    channel_id: { type: String, required: false },
    role: { type: String, required: true },
  },
  {
    collection: "users",
  }
);

const model = mongoose.model("UserSchema", UserSchema);

module.exports = model;
