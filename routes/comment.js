const mongoose = require("mongoose");
const passport = require("passport");
const plm = require("passport-local-mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/courseMatch");

const commentSchema = new mongoose.Schema({
  fullname: {
    type: String,
  },
  profileImage: String,

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  replies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Comment', commentSchema);
