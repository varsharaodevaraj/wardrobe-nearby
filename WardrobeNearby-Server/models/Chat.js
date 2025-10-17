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
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'read'],
    default: 'sent',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  messageType: {
    type: String,
    enum: ['text', 'request', 'system'],
    default: 'text',
  },
  itemInfo: {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item' },
    itemName: String,
    itemImage: String,
    rentalId: { type: Schema.Types.ObjectId, ref: 'Rental' }, // Added rentalId
  },
});

const ChatSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  relatedItem: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
  },
  messages: [MessageSchema],
  lastMessage: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true, // Will be set to false for rental requests initially
  },
  unreadCount: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    count: { type: Number, default: 0 },
  }],
  typingUsers: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    lastTyping: { type: Date },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Chat', ChatSchema);