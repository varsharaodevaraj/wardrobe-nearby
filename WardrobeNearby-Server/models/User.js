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
  followers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
  following: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User"  // must match the model name u are giving 
  }],
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
