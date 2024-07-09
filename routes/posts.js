const mongoose = require("mongoose");
const passport = require("passport");
const plm = require("passport-local-mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/courseMatch");

// mongoose.connect("mongodb+srv://peerzadaowais:IDK8756idontknow%40@cluster0.wotvbmo.mongodb.net/courseMatch");
// const uri = 'mongodb+srv://peerzadaowais:IDK8756idontknow%40@cluster0.wotvbmo.mongodb.net/courseMatch';

// mongoose.connect(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   ssl: true
// }).then(() => {
//   console.log('MongoDB connected');
// }).catch(err => {
//   console.error('MongoDB connection error:', err);
// });
const postSchema = new mongoose.Schema({
  fullname: String,
  profileImage: String,
  content: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  comments: [
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
// Virtual for formatted date and time
postSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
});

module.exports = mongoose.model("Post", postSchema);





