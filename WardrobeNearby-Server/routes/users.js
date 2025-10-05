const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

// @route   PUT /api/users/profile
// @desc    Update user profile (name, bio, profileImage)
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, bio, profileImage } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (profileImage) user.profileImage = profileImage;
    
    await user.save();
    res.json({ id: user.id, name: user.name, email: user.email, community: user.community, bio: user.bio, profileImage: user.profileImage });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   POST /api/users/push-token
// @desc    Save a user's push notification token
// @access  Private
router.post('/push-token', auth, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.pushToken = token;
    await user.save();
    res.json({ message: 'Token saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error saving push token' });
  }
});

// @route   PUT /api/users/community
// @desc    Update the user's community
// @access  Private
router.put('/community', auth, async (req, res) => {
  try {
    const { community } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.community = community || null;
    await user.save();
    await Item.updateMany({ user: req.user.id }, { $set: { community: user.community } });

    const updatedUser = { id: user.id, name: user.name, email: user.email, community: user.community };
    res.json({ message: 'Community updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating community' });
  }
});

// @route   GET /api/users/profile/:userId
// @desc    Get user profile by ID
// @access  Private
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password').populate('wishlist');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/users/wishlist/:itemId
// @desc    Add an item to the wishlist
// @access  Private
router.post('/wishlist/:itemId', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });
    if (currentUser.wishlist.some(id => id.equals(req.params.itemId))) {
      return res.status(400).json({ message: 'Item already in wishlist' });
    }
    currentUser.wishlist.push(req.params.itemId);
    await currentUser.save();
    res.json({ message: 'Item added to wishlist' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/users/wishlist/:itemId
// @desc    Remove an item from the wishlist
// @access  Private
router.delete('/wishlist/:itemId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });
    const initialLength = currentUser.wishlist.length;
    currentUser.wishlist = currentUser.wishlist.filter(itemId => !itemId.equals(req.params.itemId));
    if (currentUser.wishlist.length === initialLength) {
      return res.status(404).json({ message: 'Item not found in wishlist' });
    }
    await currentUser.save();
    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/users/wishlist
// @desc    Get the current user's wishlist
// @access  Private
router.get('/wishlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'wishlist',
      populate: { path: 'user', select: 'name status' }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;