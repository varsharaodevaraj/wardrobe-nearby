const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RentalSchema = new Schema({
  item: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  borrower: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // We can add start and end dates later
  // For now, we'll track the status of the request
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'completed'],
    default: 'pending',
  },
  requestDate: {
    type: Date,
    default: Date.now,
  },
  acceptedDate: {
    type: Date,
  },
  completedDate: {
    type: Date,
  },
});

// Middleware to set dates when status changes
RentalSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'accepted' && !this.acceptedDate) {
      this.acceptedDate = new Date();
    } else if (this.status === 'completed' && !this.completedDate) {
      this.completedDate = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('Rental', RentalSchema);