const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ date: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

router.post('/', async (req, res) => {
  const { name, category, description, price_per_day, imageUrl, userId } = req.body;
  try {
    const newItem = new Item({ name, category, description, price_per_day, imageUrl, user: userId });
    const item = await newItem.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const items = await Item.find({ user: req.params.userId }).sort({ date: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;