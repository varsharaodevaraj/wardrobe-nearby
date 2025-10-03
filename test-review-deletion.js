/**
 * Test Script for Review Deletion with Star Rating Update
 * 
 * This script tests that when a review is deleted, the item's star rating is properly updated
 */

const API_BASE = 'http://192.168.10.48:3000/api';

// Test data - Replace with actual IDs from your database
const testData = {
  itemId: 'YOUR_ITEM_ID',  // Replace with real item ID
  reviewId: 'YOUR_REVIEW_ID',  // Replace with real review ID
  authToken: 'YOUR_AUTH_TOKEN'  // Replace with real auth token
};

console.log('🧪 REVIEW DELETION & STAR RATING UPDATE TEST');
console.log('===========================================');
console.log('');

// Test function to check item rating before deletion
async function checkItemRatingBefore() {
  try {
    console.log('📊 Step 1: Checking item rating BEFORE review deletion...');
    
    const response = await fetch(`${API_BASE}/items/${testData.itemId}`);
    const item = await response.json();
    
    console.log(`   - Current average rating: ${item.averageRating || 0}`);
    console.log(`   - Total reviews: ${item.totalReviews || 0}`);
    
    return {
      averageRating: item.averageRating || 0,
      totalReviews: item.totalReviews || 0
    };
  } catch (error) {
    console.error('❌ Error checking item rating before:', error.message);
    return null;
  }
}

// Test function to delete review
async function deleteReview() {
  try {
    console.log('🗑️  Step 2: Deleting review...');
    
    const response = await fetch(`${API_BASE}/reviews/${testData.reviewId}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': testData.authToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Review deleted successfully:', result.message);
      return true;
    } else {
      const error = await response.json();
      console.log('   ❌ Delete failed:', error.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting review:', error.message);
    return false;
  }
}

// Test function to check item rating after deletion
async function checkItemRatingAfter() {
  try {
    console.log('📊 Step 3: Checking item rating AFTER review deletion...');
    
    // Wait a moment for the middleware to execute
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await fetch(`${API_BASE}/items/${testData.itemId}`);
    const item = await response.json();
    
    console.log(`   - New average rating: ${item.averageRating || 0}`);
    console.log(`   - New total reviews: ${item.totalReviews || 0}`);
    
    return {
      averageRating: item.averageRating || 0,
      totalReviews: item.totalReviews || 0
    };
  } catch (error) {
    console.error('❌ Error checking item rating after:', error.message);
    return null;
  }
}

// Main test function
async function runTest() {
  console.log('🚀 Starting review deletion test...\n');
  
  // Step 1: Check rating before deletion
  const ratingBefore = await checkItemRatingBefore();
  if (!ratingBefore) return;
  
  console.log('');
  
  // Step 2: Delete the review
  const deleteSuccess = await deleteReview();
  if (!deleteSuccess) return;
  
  console.log('');
  
  // Step 3: Check rating after deletion
  const ratingAfter = await checkItemRatingAfter();
  if (!ratingAfter) return;
  
  console.log('');
  console.log('📈 COMPARISON RESULTS:');
  console.log('=====================');
  
  if (ratingAfter.totalReviews === ratingBefore.totalReviews - 1) {
    console.log('✅ Total reviews count decreased correctly');
  } else {
    console.log('❌ Total reviews count did not decrease as expected');
  }
  
  if (ratingBefore.totalReviews === 1 && ratingAfter.averageRating === 0) {
    console.log('✅ Average rating reset to 0 (was the last review)');
  } else if (ratingBefore.totalReviews > 1 && ratingAfter.averageRating !== ratingBefore.averageRating) {
    console.log('✅ Average rating updated correctly');
  } else if (ratingBefore.totalReviews > 1 && ratingAfter.averageRating === ratingBefore.averageRating) {
    console.log('⚠️  Average rating unchanged (might be expected if similar ratings)');
  }
  
  console.log('\n🎉 Test completed!');
}

console.log('📋 SETUP INSTRUCTIONS:');
console.log('1. Replace testData values with real IDs from your database');
console.log('2. Get an auth token by logging in');
console.log('3. Run this script: node test-review-deletion.js');
console.log('');
console.log('💡 Expected behavior:');
console.log('- Total reviews should decrease by 1');
console.log('- Average rating should be recalculated without the deleted review');
console.log('- If it was the last review, rating should reset to 0');
console.log('');

// Uncomment to run the test (after setting up test data)
// runTest();
