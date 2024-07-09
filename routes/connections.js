const mongoose = require("mongoose");
const passport = require("passport");
const plm = require("passport-local-mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/courseMatch");
// mongoose.connect("mongodb+srv://peerzadaowais:IDK8756idontknow%40@cluster0.wotvbmo.mongodb.net/courseMatch");


var connectionSchema = new mongoose.Schema({
  requester_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: String,
});
// UserSchema.plugin(plm);
module.exports = mongoose.model("Connection", connectionSchema);
