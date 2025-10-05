const express = require('express');
const router = express.Router();

// This is a predefined list of communities.
// You can expand this list or move it to a database later.
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