const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  price_per_day: { type: Number, required: true },
  imageUrl: { type: String, required: true }, // Main/featured image (backward compatibility)
  images: [{ type: String }], // Array of all images (new feature)
  featuredImageIndex: { type: Number, default: 0 }, // Index of the featured image in images array
  listingType: { type: String, enum: ['rent', 'sell'], default: 'rent' }, // New field for rent/sell
  rentalDuration: { type: String, default: 'per day' }, // New field for rental duration
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Item', ItemSchema);