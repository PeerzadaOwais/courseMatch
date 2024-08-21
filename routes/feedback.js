const mongoose = require("mongoose");
const passport = require("passport");
const plm = require("passport-local-mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/courseMatch");
const contactSchema = new mongoose.Schema({
    fullname: String,
    email:String,
    message:String,
    createdAt: { type: Date, default: Date.now },
  });
  module.exports = mongoose.model("Feedback", contactSchema);
