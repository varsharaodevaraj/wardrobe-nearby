const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 1. Enhanced Message Schema with WhatsApp-like features
const MessageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  }, // Message text content
  timestamp: {
    type: Date,
    default: Date.now,
  }, // When the message was sent
  
  // Message status for WhatsApp-like experience
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read'],
    default: 'sent'
  }, // Message delivery status
  
  // Read receipt information
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    default: null,
  }, // When the message was read
  
  // Message type for future enhancements
  messageType: {
    type: String,
    enum: ['text', 'image', 'system'],
    default: 'text'
  },
  
  // Temporary ID for optimistic updates
  tempId: {
    type: String,
    default: null,
  }, // Client-side temporary ID for real-time updates
});

// 2. Enhanced Chat Schema with WhatsApp-like features
const ChatSchema = new Schema({
  participants: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }
  ], // Users involved in this chat (usually 2)
  
  messages: [MessageSchema], // Array of messages in the chat
  
  lastMessage: {
    type: Date,
    default: Date.now,
  }, // Timestamp of the last message
  
  // Typing indicator tracking
  typingUsers: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    lastTyping: {
      type: Date,
      default: Date.now,
    }
  }], // Users currently typing
  
  // Unread message counts per user
  unreadCount: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    count: {
      type: Number,
      default: 0,
    }
  }],
  
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
