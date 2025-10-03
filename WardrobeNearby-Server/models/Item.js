const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 1. Define the Item Schema
const ItemSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  price_per_day: { 
    type: Number, 
    required: true 
  },
  imageUrl: { 
    type: String, 
    required: true 
  }, // For backward compatibility (main image)
  
  images: [{ 
    type: String 
  }], // Array of all item images

  featuredImageIndex: { 
    type: Number, 
    default: 0 
  }, // Which image in `images` is the "main" one

  listingType: { 
    type: String, 
    enum: ["rent", "sell"], 
    default: "rent" 
  }, // Either renting or selling

  rentalDuration: { 
    type: String, 
    default: "per day" 
  }, // How the rent is measured

  reasonForSelling: {
    type: String,
    required: false
  }, // Optional reason why the owner is selling/renting

  isAvailable: {
    type: Boolean,
    default: true
  }, // Whether the item is currently available for rent/sale

  // Review-related fields for aggregated data
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },

  user: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }, // Reference to the user who owns the item

  date: { 
    type: Date, 
    default: Date.now 
  } // Auto timestamp when created
});

// 2. Export the Item model
module.exports = mongoose.model("Item", ItemSchema);