const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

const ChatSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  messages: [MessageSchema],
  lastMessage: {
    type: Date,
    default: Date.now,
  },
  // Optional: link to an item that started the conversation
  relatedItem: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure only two participants per chat
ChatSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    next(new Error('Chat must have exactly two participants'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Chat', ChatSchema);
