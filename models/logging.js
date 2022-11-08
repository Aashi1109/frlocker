const mongoose = require("mongoose");

const { Schema } = mongoose;

const loggingSchema = new Schema({
  lockerid: String,
  date: {
    type: Date,
    default: Date.now(),
  },
  p_user: String,
  p_img: String,
});

const Logging = new mongoose.model("Logging", loggingSchema);

module.exports = { Logging };
