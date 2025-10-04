const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Item = require('../models/Item');

// @route   GET /api/items/featured
// @desc    Get a few featured items (e.g., for Deals of the Day)
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const featuredItems = await Item.aggregate([
      // 1. Find available items
      { $match: { isAvailable: true } },
      // 2. Get a random sample of 10 to ensure we have enough after filtering
      { $sample: { size: 10 } },
      // 3. Look up the user for each item
      {
        $lookup: {
          from: 'users', // The collection name for the User model is 'users'
          localField: 'user',
          foreignField: '_id',
          as: 'userObject' // Store the found user in a temporary field
        }
      },
      // 4. Filter out any items where the user was not found (i.e., user was deleted)
      { $match: { 'userObject': { $ne: [] } } },
      // 5. Take the first 5 valid items from the random sample
      { $limit: 5 },
      // 6. Reshape the data to be clean for the frontend
      {
        $project: {
          // Include all item fields
          name: 1,
          category: 1,
          description: 1,
          price_per_day: 1,
          imageUrl: 1,
          images: 1,
          featuredImageIndex: 1,
          listingType: 1,
          rentalDuration: 1,
          isAvailable: 1,
          averageRating: 1,
          totalReviews: 1,
          date: 1,
          // Format the user field to look like it was populated
          user: {
            $arrayElemAt: ['$userObject', 0]
          }
        }
      }
    ]);
    res.json(featuredItems);
  } catch (error) {
    console.error('Error fetching featured items:', error);
    // Ensure a JSON response is sent even on failure
    res.status(500).json({ message: 'Server Error while fetching featured items' });
  }
});

// @route   GET /api/items
// @desc    Get all items, with search and filtering
router.get('/', async (req, res) => {
  try {
    const { search, size, color, occasion, sort } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    if (size) query.size = { $regex: size, $options: 'i' };
    if (color) query.color = { $regex: color, $options: 'i' };
    if (occasion) query.occasion = { $regex: occasion, $options: 'i' };

    let sortOption = { date: -1 }; // Default sort by newest
    if (sort === 'price-asc') sortOption = { price_per_day: 1 };
    if (sort === 'price-desc') sortOption = { price_per_day: -1 };
    if (sort === 'rating') sortOption = { averageRating: -1 };

    const items = await Item.find(query).populate('user', 'name status').sort(sortOption);
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


// @route   GET /api/items/:id
// @desc    Get single item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('user', 'name status');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ message: 'Server Error' });
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
    res.status(500).json({ message: 'Server Error' });
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
    res.status(500).json({ message: 'Server Error' });
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
      res.status(500).json({ message: 'Server Error' });
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
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;