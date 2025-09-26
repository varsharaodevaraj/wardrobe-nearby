const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // --- IMPORT JWT ---
const User = require('../models/User');

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists.' });
    user = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).send('Server error');
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    // --- CREATE THE JWT ---
    const payload = {
      user: {
        id: user.id, // We put the user's ID inside the token
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET, // The secret key from our .env file
      { expiresIn: '8h' }, // The token will be valid for 8 hours
      (err, token) => {
        if (err) throw err;
        // --- SEND THE TOKEN BACK TO THE APP ---
        res.status(200).json({ 
          message: 'Login successful!', 
          token: token, // The VIP Pass
          user: { id: user.id, name: user.name } 
        });
      }
    );
  } catch (error) {
    res.status(500).send('Server error');
  }
});

module.exports = router;