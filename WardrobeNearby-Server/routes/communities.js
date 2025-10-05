const express = require('express');
const router = express.Router();

// This is a predefined list of communities.
// In a real-world app, you might store this in your database.
const communities = [
  "Christ University, Koramangala",
  "Jayanagar 4th Block",
  "Indiranagar",
  "Koramangala 5th Block",
  "HSR Layout",
  "Mount Carmel College",
  "St. Joseph's University",
  "Whitefield",
];

// @route   GET /api/communities
// @desc    Get a list of all available communities
// @access  Public
router.get('/', (req, res) => {
  res.json(communities.sort());
});

module.exports = router;