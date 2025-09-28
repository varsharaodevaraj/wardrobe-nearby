const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Item = require('../models/Item');

// @route   GET /api/items
// @desc    Get all items, with search
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = { $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
        ]};
    }
    const items = await Item.find(query).populate('user', 'name').sort({ date: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/items/:id
// @desc    Get single item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('user', 'name');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/items
// @desc    Add new item
router.post('/', auth, async (req, res) => {
  try {
    const newItem = new Item({
      ...req.body,
      user: req.user.id,
    });
    const item = await newItem.save();
    res.json(item);
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/items/user/:userId
// @desc    Get items by user ID
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const items = await Item.find({ user: req.params.userId });
    res.json(items);
  } catch (error) {
    console.error('Error fetching user items:', error);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/items/:id
// @desc    Delete an item
router.delete('/:id', auth, async (req, res) => {
  try {
      const item = await Item.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Item not found' });
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

// @route   PUT /api/items/:id
// @desc    Update an item
router.put('/:id', auth, async (req, res) => {
  try {
    let item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

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

module.exports = router;