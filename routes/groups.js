const mongoose = require("mongoose");
const passport = require("passport");
const plm = require("passport-local-mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/courseMatch");
// mongoose.connect("mongodb+srv://peerzadaowais:IDK8756idontknow%40@cluster0.wotvbmo.mongodb.net/courseMatch");


const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  picture: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Group", groupSchema);