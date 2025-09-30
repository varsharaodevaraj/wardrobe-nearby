const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 1. Nested Message Schema
const MessageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  }, // Message ka text
  timestamp: {
    type: Date,
    default: Date.now,
  }, // When the message was sent
  isRead: {
    type: Boolean,
    default: false,
  }, 
});

// 2. Chat ka Schema
const ChatSchema = new Schema({
  participants: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }
  ], // Users tht are involved in this chat (usually 2)
  messages: [MessageSchema], // Array of messages in the chat(ehh chat lo unde msges)
  lastMessage: {
    type: Date,
    default: Date.now,
  }, // Timestamp of the last message
  relatedItem: {
    type: Schema.Types.ObjectId,
    ref: "Item",
  }, // Optional: which item this chat is about
  createdAt: {
    type: Date,
    default: Date.now,
  }, // When the chat was created
});

// 3. yeh h pre save hook to enforce ki exactly 2 participants are in the chat
ChatSchema.pre("save", function (next) {
  if (this.participants.length !== 2) {
    next(new Error("Chat must have exactly two participants"));
  } else {
    next();
  }
});

// 4. Export Chat model
module.exports = mongoose.model("Chat", ChatSchema);
