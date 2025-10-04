const mongoose = require("mongoose");

// 1. defining the user Schema:
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
  profileImage: { 
    type: String 
  },
  bio: { 
    type: String 
  },
  joinDate: { 
    type: Date, 
    default: Date.now 
  }
});

// 2. exporting the model
module.exports = mongoose.model("User", UserSchema);