const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserReviewSchema = new Schema({
  rental: {
    type: Schema.Types.ObjectId,
    ref: 'Rental',
    required: true,
  },
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: { // The role of the reviewer in this transaction
    type: String,
    enum: ['lender', 'renter'],
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can only review another user once per rental
UserReviewSchema.index({ rental: 1, reviewer: 1 }, { unique: true });

// After a review is saved, update the average rating for the user being reviewed
UserReviewSchema.post('save', async function() {
  await this.constructor.updateUserRating(this.reviewee);
});

UserReviewSchema.statics.updateUserRating = async function(userId) {
  const User = mongoose.model('User');
  
  const stats = await this.aggregate([
    { $match: { reviewee: userId } },
    {
      $group: {
        _id: '$reviewee',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  try {
    if (stats.length > 0) {
      await User.findByIdAndUpdate(userId, {
        averageRating: stats[0].averageRating,
        totalRatings: stats[0].totalRatings
      });
    } else {
      await User.findByIdAndUpdate(userId, {
        averageRating: 0,
        totalRatings: 0
      });
    }
  } catch (err) {
    console.error(err);
  }
};

module.exports = mongoose.model('UserReview', UserReviewSchema);