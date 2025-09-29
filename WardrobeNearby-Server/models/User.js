const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who follow this user
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users this user follows
  profileImage: { type: String }, // Optional profile image
  bio: { type: String }, // Optional user bio
  joinDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
