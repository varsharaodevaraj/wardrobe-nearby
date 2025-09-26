const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 1. Get token from the request header
  const token = req.header('x-auth-token');

  // 2. Check if there's no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // 3. Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 4. If valid, add the user's ID to the request object
    req.user = decoded.user;
    next(); // Move on to the next function (the actual route)
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};