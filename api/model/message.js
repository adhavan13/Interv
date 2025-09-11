const mongoose = require("mongoose");
const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "model", "system"], // system optional if you add instructions
    required: true,
  },
  problemId: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model("messages", MessageSchema);
module.exports = Message;
