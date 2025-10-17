const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

module.exports = async function (req, res, next) {
  // 1. Get token from the request header
  const token = req.header('x-auth-token');

  // 2. Check if there's no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // 3. Verify the token and check if user exists
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // **THIS IS THE FIX**: Verify user exists in the database
    const user = await User.findById(decoded.user.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found, authorization denied' });
    }
    
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};