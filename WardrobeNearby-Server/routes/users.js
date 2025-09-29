const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/users/profile/:userId
// @desc    Get user profile by ID
// @access  Private
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('followers', 'name profileImage')
      .populate('following', 'name profileImage');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/follow/:userId
// @desc    Follow a user
// @access  Private
router.post('/follow/:userId', auth, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.params.userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    // Check if already following
    if (currentUser.following.includes(req.params.userId)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Add to following/followers lists
    currentUser.following.push(req.params.userId);
    userToFollow.followers.push(req.user.id);

    await currentUser.save();
    await userToFollow.save();

    res.json({ message: 'User followed successfully' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/unfollow/:userId
// @desc    Unfollow a user
// @access  Private
router.post('/unfollow/:userId', auth, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if not following
    if (!currentUser.following.includes(req.params.userId)) {
      return res.status(400).json({ message: 'Not following this user' });
    }

    // Remove from following/followers lists
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== req.params.userId
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.user.id
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/following-status/:userId
// @desc    Check if current user is following another user
// @access  Private
router.get('/following-status/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const isFollowing = currentUser.following.includes(req.params.userId);
    
    res.json({ isFollowing });
  } catch (error) {
    console.error('Error checking following status:', error);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/feed
// @desc    Get items from followed users (activity feed)
// @access  Private
router.get('/feed', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    // Get items from users that the current user follows
    const Item = require('../models/Item');
    const feedItems = await Item.find({ 
      user: { $in: currentUser.following } 
    })
    .populate('user', 'name profileImage')
    .sort({ date: -1 })
    .limit(50);

    res.json(feedItems);
  } catch (error) {
    console.error('Error fetching user feed:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
