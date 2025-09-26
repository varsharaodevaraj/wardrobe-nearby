const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// ROUTE:  GET /api/items
// DESC:   Get all items, with optional search functionality
// ACCESS: Public
router.get('/', async (req, res) => {
  try {
    // --- THIS IS THE NEW SEARCH LOGIC ---
    const { search } = req.query; // Check for a 'search' query parameter in the URL
    
    let query = {}; // Start with an empty query object

    if (search) {
      // If a search term is provided, build a query to search the 'name' and 'description' fields.
      // The '$regex' operator provides powerful text search capabilities.
      // The '$options: 'i'' makes the search case-insensitive.
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
        ],
      };
    }

    // Pass the query object to the find() method. If no search term, it's empty and finds all items.
    const items = await Item.find(query).sort({ date: -1 });
    res.json(items);
    
  } catch (error) {
    console.error('Error fetching items:', error.message);
    res.status(500).send('Server Error');
  }
});

// ROUTE:  POST /api/items
// DESC:   Add a new item to the database
// ACCESS: Private (Requires token)
router.post('/', auth, async (req, res) => {
  const { name, category, description, price_per_day, imageUrl } = req.body;
  try {
    const newItem = new Item({
      name, category, description, price_per_day, imageUrl,
      user: req.user.id, // Get user ID from the secure token
    });
    const item = await newItem.save();
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error.message);
    res.status(500).send('Server Error');
  }
});

// ROUTE:  GET /api/items/user/:userId
// DESC:   Get all items listed by a specific user
// ACCESS: Private (Requires token)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const items = await Item.find({ user: req.params.userId }).sort({ date: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching user items:', error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;