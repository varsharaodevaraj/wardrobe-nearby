const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Email validation utility function
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!email) return { isValid: false, error: 'Email is required' };
  
  const trimmedEmail = email.trim();
  if (!trimmedEmail) return { isValid: false, error: 'Email cannot be empty' };
  if (trimmedEmail.length < 5) return { isValid: false, error: 'Email is too short' };
  if (trimmedEmail.length > 254) return { isValid: false, error: 'Email is too long' };
  
  const atCount = (trimmedEmail.match(/@/g) || []).length;
  if (atCount !== 1) return { isValid: false, error: 'Email must contain exactly one @ symbol' };
  
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g., user@example.com)' };
  }
  
  return { isValid: true, email: trimmedEmail.toLowerCase() };
};

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validate input fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.error });
    }

    const normalizedEmail = emailValidation.email;

    // Check if user already exists (using normalized email)
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Create new user with normalized email
    user = new User({ 
      name: name.trim(), 
      email: normalizedEmail, 
      password 
    });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();

    console.log(`[AUTH] New user registered: ${normalizedEmail}`);
    res.status(201).json({ 
      message: 'Account created successfully! Please log in to continue.',
      email: normalizedEmail 
    });
  } catch (error) {
    console.error('[AUTH] Signup error:', error);
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

    // --- CREATE THE JWT ---
    const payload = {
      user: {
        id: user.id, // putting the user's ID inside the token
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET, // The secret key from our .env file
      { expiresIn: '8h' }, // The token will be valid for 8 hours
      (err, token) => {
        if (err) throw err;
        // --- SENDingg THE TOKEN BACK TO THE APP ---
        res.status(200).json({ 
          message: 'Login successful!', 
          token: token,
          user: { id: user.id, name: user.name } 
        });
      }
    );
  } catch (error) {
    res.status(500).send('Server error');
  }
});

module.exports = router;