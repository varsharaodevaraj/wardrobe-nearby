const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Item = require('../models/Item');
const User = require('../models/User');
const Rental = require('../models/Rental');
const UserReview = require('../models/UserReview');
const auth = require('../middleware/auth');

// @route   GET /api/reviews/item/:itemId
// @desc    Get all reviews for a specific item
// @access  Public
router.get('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    // Build sort criteria
    let sortCriteria = {};
    switch (sort) {
      case 'newest':
        sortCriteria = { createdAt: -1 };
        break;
      case 'oldest':
        sortCriteria = { createdAt: 1 };
        break;
      case 'highest':
        sortCriteria = { rating: -1 };
        break;
      case 'lowest':
        sortCriteria = { rating: 1 };
        break;
      default:
        sortCriteria = { createdAt: -1 };
    }

    const reviews = await Review.find({ 
      item: itemId, 
      status: 'active' 
    })
      .populate('reviewer', 'name profileImage')
      .sort(sortCriteria)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get average rating and total count
    const averageData = await Review.calculateAverageRating(itemId);

    res.json({
      reviews,
      pagination: {
        currentPage: page,
        totalReviews: averageData.totalReviews,
        hasMore: reviews.length === parseInt(limit)
      },
      averageRating: Math.round(averageData.averageRating * 10) / 10,
      totalReviews: averageData.totalReviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error while fetching reviews' });
  }
});

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { itemId, rating, comment } = req.body;

    // Validation
    if (!itemId || !rating || !comment) {
      return res.status(400).json({ 
        message: 'Item ID, rating, and comment are required' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: 'Rating must be between 1 and 5' 
      });
    }

    if (comment.trim().length < 10) {
      return res.status(400).json({ 
        message: 'Comment must be at least 10 characters long' 
      });
    }

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Prevent users from reviewing their own items
    if (item.user.toString() === req.user.id) {
      return res.status(400).json({ 
        message: 'You cannot review your own item' 
      });
    }

    // Check if user has an accepted request for this item
    const acceptedRental = await Rental.findOne({
      item: itemId,
      borrower: req.user.id,
      status: 'accepted'
    });

    if (!acceptedRental) {
      return res.status(403).json({ 
        message: 'You can only review items after your request has been accepted by the owner' 
      });
    }

    // Check if user already reviewed this item
    const existingReview = await Review.findOne({
      item: itemId,
      reviewer: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this item' 
      });
    }

    // Create the review
    const review = new Review({
      item: itemId,
      reviewer: req.user.id,
      itemOwner: item.user,
      rating: parseInt(rating),
      comment: comment.trim()
    });

    await review.save();

    // Populate reviewer info for response
    await review.populate('reviewer', 'name profileImage');

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    
    // Handle duplicate review error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'You have already reviewed this item' 
      });
    }
    
    res.status(500).json({ message: 'Server error while creating review' });
  }
});

// @route   PUT /api/reviews/:reviewId
// @desc    Update a review (only by the reviewer)
// @access  Private
router.put('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ 
        message: 'Rating must be between 1 and 5' 
      });
    }

    if (comment && comment.trim().length < 10) {
      return res.status(400).json({ 
        message: 'Comment must be at least 10 characters long' 
      });
    }

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the current user is the reviewer
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'You can only edit your own reviews' 
      });
    }

    // Update the review
    if (rating) review.rating = parseInt(rating);
    if (comment) review.comment = comment.trim();
    
    await review.save();
    await review.populate('reviewer', 'name profileImage');

    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Server error while updating review' });
  }
});

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review (only by the reviewer)
// @access  Private
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the current user is the reviewer
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'You can only delete your own reviews' 
      });
    }

    // Store the item ID to update rating after deletion
    const itemId = review.item;

    // Delete the review using findOneAndDelete to trigger middleware
    await Review.findOneAndDelete({ _id: reviewId });

    res.json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error while deleting review' });
  }
});

// @route   GET /api/reviews/user/:userId/about
// @desc    Get all reviews ABOUT a specific user
// @access  Private
router.get('/user/:userId/about', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const reviews = await UserReview.find({ reviewee: userId })
            .populate('reviewer', 'name profileImage')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews about user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/reviews/user/:userId/written
// @desc    Get all reviews WRITTEN BY a specific user (both item and user reviews)
// @access  Private
router.get('/user/:userId/written', auth, async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch item reviews written by the user
        const itemReviews = await Review.find({ reviewer: userId, status: 'active' })
            .populate('reviewer', 'name profileImage')
            .populate('item', 'name')
            .sort({ createdAt: -1 });

        // Fetch user reviews written by the user
        const userReviews = await UserReview.find({ reviewer: userId })
            .populate('reviewer', 'name profileImage')
            .populate('reviewee', 'name')
            .sort({ createdAt: -1 });

        // Combine and format the reviews for consistent display
        const combined = [
            ...itemReviews.map(r => ({
                ...r.toObject(),
                _id: `item_${r._id}`, // Ensure unique key
                comment: `(Review for item: ${r.item.name}) ${r.comment}`
            })),
            ...userReviews.map(r => ({
                ...r.toObject(),
                _id: `user_${r._id}`, // Ensure unique key
                comment: `(Review for user: ${r.reviewee.name}) ${r.comment}`
            }))
        ];

        // Sort combined reviews by date
        combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(combined);
    } catch (error) {
        console.error('Error fetching reviews written by user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// @route   POST /api/reviews/:reviewId/helpful
// @desc    Mark a review as helpful
// @access  Private
router.post('/:reviewId/helpful', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Increment helpful count
    review.helpfulCount += 1;
    await review.save();

    res.json({
      message: 'Review marked as helpful',
      helpfulCount: review.helpfulCount
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/can-review/:itemId
// @desc    Check if user can write a review for an item
// @access  Private
router.get('/can-review/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    // Check if item exists and get item owner
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user is the item owner
    if (item.user.toString() === userId) {
      return res.json({
        canReview: false,
        reason: 'own_item',
        message: 'You cannot review your own item'
      });
    }

    // Check if user has already written a review
    const existingReview = await Review.findOne({
      item: itemId,
      reviewer: userId
    });

    if (existingReview) {
      return res.json({
        canReview: false,
        reason: 'already_reviewed',
        message: 'You have already reviewed this item'
      });
    }

    // Check if user has an accepted rental/purchase request for this item
    const acceptedRental = await Rental.findOne({
      item: itemId,
      borrower: userId,
      status: 'accepted'
    });

    if (!acceptedRental) {
      return res.json({
        canReview: false,
        reason: 'no_accepted_request',
        message: 'You can only review items after your request has been accepted by the owner'
      });
    }

    // User can write a review
    res.json({
      canReview: true,
      message: 'You can write a review for this item'
    });

  } catch (error) {
    console.error('Error checking review permission:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// @route   POST /api/reviews/user-review
// @desc    Create a new user-to-user review
// @access  Private
router.post('/user-review', auth, async (req, res) => {
    try {
        const { rentalId, rating, comment } = req.body;
        const reviewerId = req.user.id;

        const rental = await Rental.findById(rentalId);
        if (!rental) {
            return res.status(404).json({ message: 'Rental not found.' });
        }

        const isRenter = rental.borrower.toString() === reviewerId;
        const isOwner = rental.owner.toString() === reviewerId;

        if (!isRenter && !isOwner) {
            return res.status(403).json({ message: 'You are not part of this rental transaction.' });
        }

        const revieweeId = isRenter ? rental.owner : rental.borrower;
        const role = isRenter ? 'renter' : 'lender';

        const existingReview = await UserReview.findOne({ rental: rentalId, reviewer: reviewerId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this transaction.' });
        }

        const newUserReview = new UserReview({
            rental: rentalId,
            reviewer: reviewerId,
            reviewee: revieweeId,
            role,
            rating,
            comment,
        });

        await newUserReview.save();
        res.status(201).json({ message: 'Your review has been submitted successfully.' });

    } catch (error) {
        console.error("Error submitting user review:", error);
        res.status(500).send('Server Error');
    }
});


module.exports = router;