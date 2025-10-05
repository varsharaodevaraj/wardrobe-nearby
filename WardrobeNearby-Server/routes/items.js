const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Item = require('../models/Item');
const User = require('../models/User');

// @route   POST /api/items
// @desc    Add new item
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newItem = new Item({
      ...req.body,
      user: req.user.id,
      community: user.community, // Automatically add user's community
    });
    const item = await newItem.save();
    res.json(item);
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/items
// @desc    Get all items, with search and filtering
router.get('/', auth, async (req, res) => {
  try {
    const { search, size, color, occasion, sort, community } = req.query;
    let query = {};
    const currentUser = await User.findById(req.user.id);

    // If community filter is active, only show items from that community
    if (community === 'true' && currentUser.community) {
      query.community = currentUser.community;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }
    // ... (rest of the file is the same)
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).send('Server Error');
  }
});

// (The rest of the items.js file remains the same)
// ...
module.exports = router;