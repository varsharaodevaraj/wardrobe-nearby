const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const auth = require('../middleware/auth'); // Secure our endpoint

// ROUTE:    GET /api/stories
// DESC:     Get all active stories
// ACCESS:   Private
router.get('/', auth, async (req, res) => {
  try {
    // Find all stories and populate the user's name and a profile picture field (if we add one later)
    const stories = await Story.find()
      .populate('user', ['name']) 
      .sort({ createdAt: -1 }); // Show newest stories first
    res.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).send('Server Error');
  }
});

// ROUTE:    POST /api/stories
// DESC:     Create a new story
// ACCESS:   Private
router.post('/', auth, async (req, res) => {
  try {
    const { imageUrl, linkedItemId } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required.' });
    }

    const newStory = new Story({
      imageUrl,
      linkedItem: linkedItemId, // This is optional
      user: req.user.id, // The user ID comes from our auth middleware token
    });

    await newStory.save();
    res.status(201).json({ message: 'Story posted successfully!', story: newStory });

  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;