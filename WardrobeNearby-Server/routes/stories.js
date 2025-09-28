const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const auth = require('../middleware/auth');

// GET /api/stories - Get all active stories
router.get('/', auth, async (req, res) => {
  try {
    const stories = await Story.find()
      .populate('user', ['name'])
      .populate('linkedItem')
      .sort({ createdAt: -1 });
    res.json(stories);
  } catch (error)
 {
    console.error('Error fetching stories:', error);
    res.status(500).send('Server Error');
  }
});

// POST /api/stories - Create a new story
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

// --- THIS IS THE NEW ENDPOINT ---
// ROUTE:    DELETE /api/stories/:id
// DESC:     Delete a story
// ACCESS:   Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Security Check: Ensure the user owns the story
        if (story.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await Story.findByIdAndDelete(req.params.id);

        res.json({ message: 'Story removed successfully' });
    } catch (error) {
        console.error('Error deleting story:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;