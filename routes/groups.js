const mongoose = require("mongoose");
const passport = require("passport");
const plm = require("passport-local-mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/courseMatch");
// Message schema
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: String,
  timestamp: { type: Date, default: Date.now },
});
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  picture: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  messages: [messageSchema], // Embedding messages
});

module.exports = mongoose.model("Group", groupSchema);
