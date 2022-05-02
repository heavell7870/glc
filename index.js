const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const sanitize = require("express-mongo-sanitize");
const authApp = require("./authentication");
const userApp = require("./user");
const cors = require("cors");
const streamApp = require("./stream");
const scheduleApp = require("./schedule");
mongoose
  .connect(
    "mongodb+srv://admin1:glance123@cluster0.ftdmm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    }
  )
  .then(() => {
    console.log("db connected");
  });

const app = express();

app.use(express.json());
app.use(sanitize());
app.use(cors());
app.use("/api/auth", authApp);
app.use("/api/user", userApp);
app.use("/api/stream", streamApp);
app.use("/api/schedule", scheduleApp);

app.listen(9999, () => {
  console.log("Server running");
});
