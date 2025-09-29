const express = require('express');
const router = express.Router();
const Rental = require('../models/Rental');
const Item = require('../models/Item');
const Chat = require('../models/Chat');
const User = require('../models/User');
const auth = require('../middleware/auth');

// POST /api/rentals/request
router.post('/request', auth, async (req, res) => {
  try {
    const { itemId, customMessage } = req.body;
    
    // Find the item
    const item = await Item.findById(itemId).populate('user', 'name');
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    
    // Check if user is trying to rent their own item
    if (item.user._id.toString() === req.user.id) {
      return res.status(200).json({ message: "This is your own item. You can manage it from your profile.", isOwnItem: true });
    }

    // Check if user has already sent a request for this item (prevent duplicates)
    const existingRequest = await Rental.findOne({
      item: itemId,
      borrower: req.user.id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You have already sent a request for this item. Please wait for the owner to respond.',
        alreadyRequested: true 
      });
    }

    // Get current user info
    const currentUser = await User.findById(req.user.id).select('name');
    
    // Create the rental request
    const newRental = new Rental({ 
      item: itemId, 
      borrower: req.user.id, 
      owner: item.user._id 
    });
    await newRental.save();

    // Create or find existing chat between borrower and owner
    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, item.user._id] }
    });

    if (!chat) {
      // Create new chat if it doesn't exist
      chat = new Chat({
        participants: [req.user.id, item.user._id],
        relatedItem: itemId
      });
    }

    // Create automatic notification message with optional custom message
    const isForSale = item.listingType === 'sell';
    const actionEmoji = isForSale ? '�' : '�🛍️';
    const actionText = isForSale ? 'Purchase Request Sent!' : 'Rental Request Sent!';
    const interestText = isForSale ? 'purchasing' : 'renting';
    const priceText = isForSale ? `₹${item.price_per_day}` : `₹${item.price_per_day}/${item.rentalDuration || 'per day'}`;
    const availabilityText = isForSale ? 'if it\'s still available for purchase' : 'if it\'s available';
    
    let messageContent = `${actionEmoji} ${actionText}\n\nI'm interested in ${interestText} "${item.name}" for ${priceText}.`;
    
    if (customMessage && customMessage.trim()) {
      messageContent += `\n\nMessage: "${customMessage.trim()}"`;
    }
    
    messageContent += `\n\nPlease let me know ${availabilityText}. Thank you!`;

    const notificationMessage = {
      sender: req.user.id,
      content: messageContent,
      timestamp: new Date(),
      isRead: false
    };

    chat.messages.push(notificationMessage);
    chat.lastMessage = new Date();
    await chat.save();

    res.status(201).json({ 
      message: 'Rental request submitted and message sent!', 
      rental: newRental,
      chatCreated: true 
    });
  } catch (error) {
    console.error('Error in rental request:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// GET /api/rentals/incoming
router.get('/incoming', auth, async (req, res) => {
    try {
        const requests = await Rental.find({ owner: req.user.id, status: 'pending' })
            .populate('item', ['name', 'imageUrl'])
            .populate('borrower', ['name']);
        
        // Filter out requests where the item or borrower has been deleted
        const validRequests = requests.filter(req => req.item && req.borrower);
        res.json(validRequests);

    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// PUT /api/rentals/:id/status
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        if (status !== 'accepted' && status !== 'declined') {
            return res.status(400).json({ message: 'Invalid status update.' });
        }
        const rental = await Rental.findById(req.params.id);
        if (!rental) return res.status(404).json({ message: 'Rental request not found.' });
        if (rental.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized.' });
        }
        rental.status = status;
        await rental.save();
        res.json({ message: `Request has been ${status}.`, rental });
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// GET /api/rentals/outgoing
router.get('/outgoing', auth, async (req, res) => {
    try {
        const requests = await Rental.find({ borrower: req.user.id })
            .populate('item', ['name', 'imageUrl'])
            .populate('owner', ['name', 'email']);

        // Filter out requests where the item or owner has been deleted
        const validRequests = requests.filter(req => req.item && req.owner);
        res.json(validRequests);

    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// GET /api/rentals/my-rentals
router.get('/my-rentals', auth, async (req, res) => {
    try {
        const rentals = await Rental.find({ borrower: req.user.id, status: 'accepted' })
            .populate('item', ['name', 'imageUrl', 'price_per_day'])
            .populate('owner', ['name', 'email']);

        // Filter out rentals where the item or owner has been deleted
        const validRentals = rentals.filter(r => r.item && r.owner);
        res.json(validRentals);

    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// DELETE /api/rentals/request/:id
router.delete('/request/:id', auth, async (req, res) => {
    try {
        const rentalRequest = await Rental.findById(req.params.id);
        if (!rentalRequest) return res.status(404).json({ message: 'Rental request not found.' });
        if (rentalRequest.borrower.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized.' });
        }
        if (rentalRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending requests can be revoked.' });
        }
        await Rental.findByIdAndDelete(req.params.id);
        res.json({ message: 'Rental request revoked successfully.' });
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;