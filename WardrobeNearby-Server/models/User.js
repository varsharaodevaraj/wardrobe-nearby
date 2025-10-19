const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  wishlist: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Item" 
  }],
  status: {
    type: String,
    enum: ['regular', 'super-lender', 'super-renter'],
    default: 'regular'
  },
  community: {
    type: String,
    required: true, // Make community mandatory
  },
  profileImage: { 
    type: String 
  },
  bio: { 
    type: String 
  },
  pushToken: { // NEW FIELD for notifications
    type: String,
  },
  // NEW FIELDS for user-to-user reviews
  averageRating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  joinDate: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("User", UserSchema);