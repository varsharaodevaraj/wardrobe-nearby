const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: false,
  },
  color: {
    type: String,
    required: false,
  },
  occasion: {
    type: String,
    required: false,
  },
  community: {
    // NEW FIELD
    type: String,
  },
  unavailableDates: [
    {
      type: String,
    },
  ],
  price_per_day: {
    type: Number,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  images: [
    {
      type: String,
    },
  ],
  featuredImageIndex: {
    type: Number,
    default: 0,
  },
  listingType: {
    type: String,
    enum: ["rent", "sell"],
    default: "rent",
  },
  rentalDuration: {
    type: String,
    default: "per day",
  },
  reasonForSelling: {
    type: String,
    required: false,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Item", ItemSchema);
