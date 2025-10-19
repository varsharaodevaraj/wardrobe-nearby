const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
  // The item being reviewed
  item: {
    type: Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },
  // The user who wrote the review (reviewer)
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // The owner of the item being reviewed
  itemOwner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Rating from 1-5 stars
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  // Review comment/text
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  // Review metadata
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // Track if this review was helpful
  helpfulCount: {
    type: Number,
    default: 0,
  },
  // Status for moderation
  status: {
    type: String,
    enum: ["active", "hidden", "reported"],
    default: "active",
  },
});

// Ensure one review per user per item
ReviewSchema.index({ item: 1, reviewer: 1 }, { unique: true });

// Update the updatedAt field on save
ReviewSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate average rating for an item (static method)
ReviewSchema.statics.calculateAverageRating = async function (itemId) {
  const result = await this.aggregate([
    { $match: { item: new mongoose.Types.ObjectId(itemId), status: "active" } },
    {
      $group: {
        _id: "$item",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return result.length > 0 ? result[0] : { averageRating: 0, totalReviews: 0 };
};

// Update item's average rating after review changes
ReviewSchema.statics.updateItemRating = async function (itemId) {
  const Item = mongoose.model("Item");
  const stats = await this.calculateAverageRating(itemId);

  await Item.findByIdAndUpdate(itemId, {
    averageRating: Math.round(stats.averageRating * 10) / 10, // Round to 1 decimal
    totalReviews: stats.totalReviews,
  });
};

// Middleware to update item rating after review save
ReviewSchema.post("save", async function () {
  await this.constructor.updateItemRating(this.item);
});

// Middleware to update item rating after review delete
ReviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await doc.constructor.updateItemRating(doc.item);
  }
});

// Also handle deleteOne and deleteMany methods
ReviewSchema.post(
  "deleteOne",
  { document: true, query: false },
  async function (doc) {
    if (doc) {
      await doc.constructor.updateItemRating(doc.item);
    }
  }
);

module.exports = mongoose.model("Review", ReviewSchema);
