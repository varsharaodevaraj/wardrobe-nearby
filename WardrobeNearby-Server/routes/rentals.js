const express = require('express');
const router = express.Router();
const Rental = require('../models/Rental');
const Item = require('../models/Item');
const Chat = require('../models/Chat');
const User = require('../models/User');
const UserReview = require('../models/UserReview');
const auth = require('../middleware/auth');

// Helper function to get dates in YYYY-MM-DD format
const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  currentDate.setUTCHours(0, 0, 0, 0);
  const lastDate = new Date(endDate);
  lastDate.setUTCHours(0, 0, 0, 0);

  while (currentDate <= lastDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

// POST /api/rentals/request
router.post('/request', auth, async (req, res) => {
  try {
    const { itemId, customMessage, startDate, endDate } = req.body;
    
    const item = await Item.findById(itemId).populate('user', 'name');
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    
    if (item.user._id.toString() === req.user.id) {
      return res.status(200).json({ message: "This is your own item.", isOwnItem: true });
    }

    const existingRequest = await Rental.findOne({
      item: itemId,
      borrower: req.user.id,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You have already sent a request for this item.',
        alreadyRequested: true 
      });
    }

    if (item.listingType === 'rent') {
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start and end dates are required for rentals.' });
      }
      const requestedDates = getDatesInRange(startDate, endDate);
      const isConflict = requestedDates.some(date => item.unavailableDates.includes(date));
      if (isConflict) {
        return res.status(400).json({ message: 'One or more of the selected dates are unavailable.' });
      }
    }
    
    const newRental = new Rental({ 
      item: itemId, 
      borrower: req.user.id, 
      owner: item.user._id,
      startDate: item.listingType === 'rent' ? startDate : null,
      endDate: item.listingType === 'rent' ? endDate : null,
    });
    await newRental.save();

    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, item.user._id] },
      relatedItem: itemId,
    });

    if (!chat) {
      chat = new Chat({
        participants: [req.user.id, item.user._id],
        relatedItem: itemId,
        isActive: false // Chat starts as inactive
      });
    }

    const isForSale = item.listingType === 'sell';
    let messageContent = isForSale 
      ? `I'm interested in purchasing this item.`
      : `I'd like to rent this item from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`;

    if (customMessage && customMessage.trim()) {
      messageContent += `\n\nMy message: "${customMessage.trim()}"`;
    }

    const notificationMessage = {
      sender: req.user.id,
      content: messageContent,
      timestamp: new Date(),
      messageType: 'request',
      itemInfo: {
          itemId: item._id,
          itemName: item.name,
          itemImage: item.images[item.featuredImageIndex || 0] || item.imageUrl,
      }
    };

    chat.messages.push(notificationMessage);
    chat.lastMessage = new Date();
    await chat.save();

    res.status(201).json({ 
      message: 'Request submitted and message sent!', 
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
        const validStatuses = ['accepted', 'declined', 'completed'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status update.' });
        }
        
        const rental = await Rental.findById(req.params.id).populate('item');
        if (!rental) return res.status(404).json({ message: 'Rental request not found.' });
        
        if (status === 'accepted' || status === 'declined') {
            if (rental.owner.toString() !== req.user.id) {
                return res.status(401).json({ message: 'Only the item owner can accept or decline requests.' });
            }
            if (rental.status !== 'pending') {
                return res.status(400).json({ message: 'Only pending requests can be accepted or declined.' });
            }
            if (status === 'accepted') {
                if (rental.item.listingType === 'rent' && rental.startDate && rental.endDate) {
                    const rentalDates = getDatesInRange(rental.startDate, rental.endDate);
                    await Item.findByIdAndUpdate(rental.item._id, {
                        $addToSet: { unavailableDates: { $each: rentalDates } }
                    });
                }
                if (rental.item.listingType === 'sell') {
                    await Item.findByIdAndUpdate(rental.item._id, { isAvailable: false });
                }
                
                // Activate the chat and send a system message
                const chat = await Chat.findOne({
                    participants: { $all: [rental.owner, rental.borrower] },
                    relatedItem: rental.item._id,
                });

                if (chat) {
                    chat.isActive = true;
                    const systemMessage = {
                        sender: rental.owner, // System message from owner's side
                        content: `Your rental request was accepted! You can now chat freely.`,
                        messageType: 'system',
                    };
                    chat.messages.push(systemMessage);
                    await chat.save();
                }
            }
        } else if (status === 'completed') {
            if (rental.owner.toString() !== req.user.id && rental.borrower.toString() !== req.user.id) {
                return res.status(401).json({ message: 'Only the item owner or borrower can mark the rental as completed.' });
            }
            if (rental.status !== 'accepted') {
                return res.status(400).json({ message: 'Only accepted rentals can be marked as completed.' });
            }
        }
        
        rental.status = status;
        await rental.save();
        res.json({ message: `Request has been ${status}.`, rental });
    } catch (error) {
        console.error('Error updating rental status:', error);
        res.status(500).send('Server Error');
    }
});

// GET /api/rentals/outgoing
router.get('/outgoing', auth, async (req, res) => {
    try {
        const requests = await Rental.find({ borrower: req.user.id })
            .populate('item', ['name', 'imageUrl'])
            .populate('owner', ['name', 'email']);

        const validRequests = requests.filter(req => req.item && req.owner);
        res.json(validRequests);

    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// GET /api/rentals/my-rentals
router.get('/my-rentals', auth, async (req, res) => {
    try {
        const rentals = await Rental.find({ $or: [{ borrower: req.user.id }, {owner: req.user.id}], status: { $in: ['accepted', 'completed'] } })
            .populate('item', ['name', 'imageUrl', 'price_per_day'])
            .populate('owner', ['name', 'email', 'profileImage'])
            .populate('borrower', ['name', 'email', 'profileImage']);

        const validRentals = rentals.filter(r => r.item && r.owner && r.borrower);
        
        const rentalsWithReviewStatus = await Promise.all(validRentals.map(async rental => {
            const hasLenderReviewed = await UserReview.exists({ rental: rental._id, reviewer: rental.owner._id });
            const hasRenterReviewed = await UserReview.exists({ rental: rental._id, reviewer: rental.borrower._id });
            return {
                ...rental.toObject(),
                hasLenderReviewed: !!hasLenderReviewed,
                hasRenterReviewed: !!hasRenterReviewed,
            };
        }));
        
        res.json(rentalsWithReviewStatus);

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