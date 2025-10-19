const express = require('express');
const router = express.Router();
const Community = require('../models/Community');

// @route   GET /api/communities
// @desc    Get a list of all approved communities
// @access  Public
router.get('/', async (req, res) => {
  try {
    const communities = await Community.find({ status: 'approved' }).sort({ name: 1 });
    res.json(communities.map(c => c.name));
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/communities/suggest
// @desc    Suggest and automatically approve a new community
// @access  Public
router.post('/suggest', async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 3) {
    return res.status(400).json({ message: 'Community name must be at least 3 characters long.' });
  }

  try {
    const trimmedName = name.trim();
    // Check if a community with this name already exists (case-insensitive)
    const existingCommunity = await Community.findOne({ name: { $regex: `^${trimmedName}$`, $options: 'i' } });
    
    if (existingCommunity) {
      // If it exists and is approved, it's a duplicate.
      if (existingCommunity.status === 'approved') {
        return res.status(400).json({ message: 'This community already exists.' });
      }
      // If it exists but is pending, we can treat this as a success for the user.
      return res.status(200).json({ message: 'This community has already been suggested and is pending approval.' });
    }

    // --- THIS IS THE FIX ---
    // The new community is now saved as 'approved' by default.
    const newCommunity = new Community({
      name: trimmedName,
      status: 'approved', 
    });

    await newCommunity.save();
    res.status(201).json({ message: 'Thank you for your contribution! The community has been added.' });
  } catch (error) {
    console.error('Error suggesting community:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;