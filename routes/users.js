const mongoose = require("mongoose");
const passport = require("passport");
const plm = require("passport-local-mongoose");
const groups = require("./groups");
mongoose.connect("mongodb://127.0.0.1:27017/courseMatch");
// mongoose.connect("mongodb+srv://peerzadaowais:IDK8756idontknow%40@cluster0.wotvbmo.mongodb.net/courseMatch");

// Define the Entry Schema
var EntrySchema = new mongoose.Schema({
  school: String,
  batch: String,
});

var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },

  resetPasswordToken:{
    type:String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  university: {
    type: String,
    // required:true,
  },
  major: {
    type: String,
    // required:true,
  },
  year: {
    type: Number,
  },
  interests: {
    type: String,
  },
  profileImage: {
    type: String, // Assuming you store the profile picture URL as a string
  },
  is_online:{
    type:Number,
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  groups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
  ],
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  entries: [EntrySchema], // Array of sub-documents
});
// UserSchema.methods.setPassword = async function(password) {
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(password, salt);
// };
// UserSchema.methods.validatePassword = async function(password) {
//   return await bcrypt.compare(password, this.password);
//   };

// UserSchema.methods.setPassword = function(password) {
//   this.salt = crypto.randomBytes(32).toString('hex');
//   this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
// };

// UserSchema.methods.validatePassword = function(password) {
//   const hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
//   return this.hash === hash;
// };
UserSchema.plugin(plm);
module.exports = mongoose.model("User", UserSchema);
