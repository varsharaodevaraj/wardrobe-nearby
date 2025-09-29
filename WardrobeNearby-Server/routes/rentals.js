const express = require('express');
const router = express.Router();
const Rental = require('../models/Rental');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// POST /api/rentals/request
router.post('/request', auth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    if (item.user.toString() === req.user.id) {
      return res.status(400).json({ message: "This is your own item. You can manage it from your profile." });
    }
    const newRental = new Rental({ item: itemId, borrower: req.user.id, owner: item.user });
    await newRental.save();
    res.status(201).json({ message: 'Rental request submitted!', rental: newRental });
  } catch (error) {
    res.status(500).send('Server Error');
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