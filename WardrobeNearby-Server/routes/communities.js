const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Community = require('../models/Community');

// @route   GET /api/communities
// @desc    Get a list of all approved communities
// @access  Public
router.get('/', async (req, res) => {
  try {
    const communities = await Community.find({ status: 'approved' }).sort({ name: 1 });
    // Keep sending back an array of strings for frontend compatibility
    res.json(communities.map(c => c.name));
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/communities/suggest
// @desc    Suggest a new community
// @access  Private
router.post('/suggest', auth, async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 3) {
    return res.status(400).json({ message: 'Community name must be at least 3 characters long.' });
  }

  try {
    // Check if a community with this name already exists (case-insensitive)
    const existingCommunity = await Community.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (existingCommunity) {
      if (existingCommunity.status === 'approved') {
        return res.status(400).json({ message: 'This community already exists.' });
      } else {
        return res.status(400).json({ message: 'This community has already been suggested and is pending approval.' });
      }
    }

    const newSuggestion = new Community({
      name: name.trim(),
      status: 'pending',
      suggestedBy: req.user.id,
    });

    await newSuggestion.save();
    res.status(201).json({ message: 'Thank you for your suggestion! It has been submitted for review.' });
  } catch (error) {
    console.error('Error suggesting community:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;