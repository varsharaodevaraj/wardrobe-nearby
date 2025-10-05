const express = require('express');
const router = express.Router();

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

router.get('/', (req, res) => {
  res.json(communities.sort());
});

module.exports = router;