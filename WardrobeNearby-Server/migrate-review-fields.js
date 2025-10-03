const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB for review fields migration');
    migrateReviewFields();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const Item = require('./models/Item');

async function migrateReviewFields() {
  try {
    console.log('🔄 Starting review fields migration...');
    
    // Find items that don't have the new review fields
    const itemsToMigrate = await Item.find({
      $or: [
        { averageRating: { $exists: false } },
        { totalReviews: { $exists: false } }
      ]
    });

    console.log(`📦 Found ${itemsToMigrate.length} items to migrate`);
    
    if (itemsToMigrate.length === 0) {
      console.log('✅ All items already have review fields');
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of itemsToMigrate) {
      try {
        const updateData = {};
        
        // Add averageRating field if missing
        if (!item.averageRating && item.averageRating !== 0) {
          updateData.averageRating = 0;
        }
        
        // Add totalReviews field if missing
        if (!item.totalReviews && item.totalReviews !== 0) {
          updateData.totalReviews = 0;
        }

        if (Object.keys(updateData).length > 0) {
          await Item.findByIdAndUpdate(item._id, updateData);
          updatedCount++;
          console.log(`✅ Updated item: ${item.name} (${item._id})`);
        } else {
          skippedCount++;
          console.log(`⏭️  Skipped item: ${item.name} (already has review fields)`);
        }

      } catch (error) {
        console.error(`❌ Error updating item ${item.name}:`, error);
        skippedCount++;
      }
    }

    console.log('\n🎉 Review fields migration completed successfully!');
    console.log('📈 Migration Statistics:');
    console.log(`   - Items processed: ${itemsToMigrate.length}`);
    console.log(`   - Items updated: ${updatedCount}`);
    console.log(`   - Items skipped: ${skippedCount}`);

    // Verify migration
    console.log('\n📊 Post-migration verification:');
    const totalItems = await Item.countDocuments();
    const itemsWithReviewFields = await Item.countDocuments({
      averageRating: { $exists: true },
      totalReviews: { $exists: true }
    });
    
    console.log(`   - Total items in database: ${totalItems}`);
    console.log(`   - Items with review fields: ${itemsWithReviewFields}`);
    console.log(`   - Migration success rate: ${((itemsWithReviewFields / totalItems) * 100).toFixed(2)}%`);
    
    if (itemsWithReviewFields < totalItems) {
      console.log('⚠️  Some items may still need migration. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    console.log('\n🔄 Closing database connection...');
    mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Review fields migration interrupted by user');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Review fields migration terminated');
  mongoose.connection.close();
  process.exit(0);
});
