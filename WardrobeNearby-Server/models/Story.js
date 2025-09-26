const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StorySchema = new Schema({
  // The user who posted the story
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // The image for the story
  imageUrl: {
    type: String,
    required: true,
  },
  // Optional link to an item in the app
  linkedItem: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: false, // Not every story has to link to an item
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // Stories will automatically be deleted after 24 hours
    expires: 86400, // 86400 seconds = 24 hours
  },
});

module.exports = mongoose.model('Story', StorySchema);