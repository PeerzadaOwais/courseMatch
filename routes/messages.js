const mongoose = require("mongoose");
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
    message: {
        type: String,
    },
    file: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model('Message', messageSchema);
