const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

router.post('/signup', async (req, res) => {
  // This route is likely fine, but we'll keep it consistent.
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
    console.error('[SERVER SIGNUP ERROR]', error);
    res.status(500).send('Server error');
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // --- DETAILED LOGGING ADDED ---
  console.log(`[SERVER] Login request received for: ${email}`);
  
  try {
    console.log('[SERVER] Step 1: Searching for user in the database...');
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('[SERVER] Result: User not found.');
      // We still send a generic message for security
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    console.log(`[SERVER] Result: User found! ID: ${user.id}`);

    console.log('[SERVER] Step 2: Comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('[SERVER] Result: Passwords do not match.');
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    console.log('[SERVER] Result: Passwords match!');

    console.log('[SERVER] Step 3: Sending success response to the app.');
    res.status(200).json({ message: 'Login successful!', user: { id: user.id, name: user.name } });

  } catch (error) {
    console.error('[SERVER LOGIN ERROR]', error);
    res.status(500).send('Server error during login process');
  }
});

module.exports = router;