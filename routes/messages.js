const mongoose = require("mongoose");
const passport = require("passport");
const plm = require("passport-local-mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/courseMatch");
const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
messageSchema.plugin(plm);
module.exports = mongoose.model('Message', messageSchema);
