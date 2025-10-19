const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Item = require('../models/Item');
const User = require('../models/User');
const mongoose = require('mongoose');

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
    const { search, community } = req.query;
    let query = {};
    const currentUser = await User.findById(req.user.id);

    // Exclude items owned by the current user
    query.user = { $ne: new mongoose.Types.ObjectId(req.user.id) };

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
    
    const items = await Item.find(query).populate('user', 'name status averageRating totalRatings').sort({ date: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/items/featured
// @desc    Get a few random items to be featured, optionally filtered by community
// @access  Private
router.get('/featured', auth, async (req, res) => {
  try {
    const { community } = req.query;
    const currentUser = await User.findById(req.user.id);

    const pipeline = [
      // Always exclude the user's own items
      { $match: { user: { $ne: new mongoose.Types.ObjectId(req.user.id) } } }
    ];

    // If community filter is on, add a match stage for the user's community
    if (community === 'true' && currentUser.community) {
      pipeline.push({ $match: { community: currentUser.community } });
    }

    // Add the random sampling stage
    pipeline.push({ $sample: { size: 5 } });
    
    // Populate user details after sampling
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    });
    pipeline.push({ $unwind: '$user' });


    const featuredItems = await Item.aggregate(pipeline);
    res.json(featuredItems);
  } catch (error) {
    console.error('Error fetching featured items:', error);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/items/user/:userId
// @desc    Get all items for a specific user
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const items = await Item.find({ user: req.params.userId }).sort({ date: -1 });
        res.json(items);
    } catch (error) {
        console.error('Error fetching user items:', error);
        res.status(500).send('Server Error');
    }
});


// @route   PUT /api/items/:id
// @desc    Update an item
router.put('/:id', auth, async (req, res) => {
    try {
        let item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        // Make sure user owns the item
        if (item.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        item = await Item.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.json(item);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/items/:id
// @desc    Delete an item
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Ensure the user owns the item
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await Item.findByIdAndDelete(req.params.id);

    res.json({ message: 'Item removed successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;