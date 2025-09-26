const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  price_per_day: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Item', ItemSchema);