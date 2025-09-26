const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const auth = require('../middleware/auth');

// ROUTE:    GET /api/stories
// DESC:     Get all active stories
// ACCESS:   Private
router.get('/', auth, async (req, res) => {
  try {
    // --- THIS IS THE UPDATE ---
    // We now .populate() both the user and the linkedItem
    const stories = await Story.find()
      .populate('user', ['name']) 
      .populate('linkedItem') // This will fetch all details for the linked item
      .sort({ createdAt: -1 });
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
      linkedItem: linkedItemId,
      user: req.user.id,
    });
    await newStory.save();
    res.status(201).json({ message: 'Story posted successfully!', story: newStory });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;