const express = require('express');
const router = express.Router();
const Rental = require('../models/Rental');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// POST /api/rentals/request - Create a new rental request
router.post('/request', auth, async (req, res) => {
  try {
    const { itemId } = req.body;
    
    // Validate item exists
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    
    // Check if user is trying to rent their own item
    if (item.user.toString() === req.user.id) {
        return res.status(400).json({ message: "You cannot rent your own item." });
    }
    
    // Check if user has already sent a pending request for this item
    const existingRequest = await Rental.findOne({ 
        item: itemId, 
        borrower: req.user.id, 
        status: 'pending' 
    });
    
    if (existingRequest) {
        return res.status(400).json({ message: 'You have already requested this item. Please wait for the owner\'s response.' });
    }
    
    // Create new rental request
    const newRental = new Rental({ 
        item: itemId, 
        borrower: req.user.id, 
        owner: item.user 
    });
    await newRental.save();
    
    console.log(`[RENTAL] New request created: User ${req.user.id} requested item ${itemId}`);
    res.status(201).json({ 
        message: `Rental request for "${item.name}" sent successfully!`, 
        rental: newRental 
    });
  } catch (error) {
    console.error('[RENTAL_REQUEST] Error:', error);
    res.status(500).json({ message: 'Server Error. Could not process your request.' });
  }
});

// GET /api/rentals/incoming - Get pending requests for an owner
router.get('/incoming', auth, async (req, res) => {
    try {
        const requests = await Rental.find({ owner: req.user.id, status: 'pending' })
            .populate('item', ['name', 'imageUrl'])
            .populate('borrower', ['name']);
        
        // Filter out requests with null/deleted items or borrowers
        const validRequests = requests.filter(request => 
            request.item && request.borrower
        );
        
        console.log(`[RENTALS] Found ${requests.length} total requests, ${validRequests.length} valid`);
        res.json(validRequests);
    } catch (error) {
        console.error('[RENTALS_INCOMING] Error:', error);
        res.status(500).send('Server Error');
    }
});

// PUT /api/rentals/:id/status - Update a request status
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

// GET /api/rentals/outgoing - Get all outgoing requests for a borrower
router.get('/outgoing', auth, async (req, res) => {
    try {
        const { status } = req.query; // Optional status filter
        let query = { borrower: req.user.id };
        
        // Add status filter if provided
        if (status) {
            query.status = status;
        }
        
        const requests = await Rental.find(query)
            .populate('item', ['name', 'imageUrl', '_id']) // Only get necessary fields
            .populate('owner', ['name'])
            .sort({ requestDate: -1 }); // Most recent first
        res.json(requests);
    } catch (error) {
        console.error('[OUTGOING_REQUESTS] Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- THIS IS THE NEW ENDPOINT ---
// ROUTE:    GET /api/rentals/my-rentals
// DESC:     Get all ACCEPTED rentals for the borrower
// ACCESS:   Private
router.get('/my-rentals', auth, async (req, res) => {
    try {
        // Find all rentals where the borrower is the logged-in user AND status is 'accepted'
        const rentals = await Rental.find({ borrower: req.user.id, status: 'accepted' })
            .populate('item', ['name', 'imageUrl', 'price_per_day']) // Get item details
            .populate('owner', ['name']);      // Get owner's name
        
        res.json(rentals);
    } catch (error) {
        console.error('Error fetching my rentals:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;