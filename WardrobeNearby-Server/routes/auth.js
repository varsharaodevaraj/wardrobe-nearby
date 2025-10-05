const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!email) return { isValid: false, error: 'Email is required' };
  if (!emailRegex.test(email)) return { isValid: false, error: 'Please enter a valid email address' };
  return { isValid: true, email: email.toLowerCase() };
};

router.post('/signup', async (req, res) => {
  const { name, email, password, community } = req.body;

  try {
    if (!name || !email || !password || !community) {
      return res.status(400).json({ message: 'All fields are required, including community' });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.error });
    }

    let user = await User.findOne({ email: emailValidation.email });
    if (user) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    user = new User({ 
      name: name.trim(), 
      email: emailValidation.email, 
      password,
      community // ADDED
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    res.status(201).json({ 
      message: 'Account created successfully! Please log in.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    const payload = { user: { id: user.id } };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' }, (err, token) => {
      if (err) throw err;
      res.status(200).json({ 
        token,
        user: { id: user.id, name: user.name, email: user.email, community: user.community } 
      });
    });
  } catch (error) {
    res.status(500).send('Server error');
  }
});

module.exports = router;