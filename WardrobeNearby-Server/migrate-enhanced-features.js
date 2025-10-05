const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB for enhanced features migration');
    migrateEnhancedFeatures();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const Item = require('./models/Item');

async function migrateEnhancedFeatures() {
  try {
    console.log('🔄 Starting enhanced features migration...');
    
    // Find items that don't have the new fields
    const itemsToUpdate = await Item.find({
      $or: [
        { reasonForSelling: { $exists: false } },
        { isAvailable: { $exists: false } },
        { images: { $exists: false } },
        { featuredImageIndex: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${itemsToUpdate.length} items to migrate`);

    let migratedCount = 0;
    for (const item of itemsToUpdate) {
      const updateFields = {};

      // Add reasonForSelling field if missing
      if (!item.reasonForSelling) {
        updateFields.reasonForSelling = '';
      }

      // Add isAvailable field if missing (default to true)
      if (item.isAvailable === undefined) {
        updateFields.isAvailable = true;
      }

      // Migrate single image to images array if missing
      if (!item.images || item.images.length === 0) {
        if (item.imageUrl) {
          updateFields.images = [item.imageUrl];
          updateFields.featuredImageIndex = 0;
        } else {
          updateFields.images = [];
          updateFields.featuredImageIndex = 0;
        }
      }

      // Add featuredImageIndex if missing
      if (item.featuredImageIndex === undefined) {
        updateFields.featuredImageIndex = 0;
      }

      // Update the item
      if (Object.keys(updateFields).length > 0) {
        await Item.findByIdAndUpdate(item._id, { $set: updateFields });
        migratedCount++;
        console.log(` Migrated item: ${item.name} (${item._id})`);
      }
    }

    console.log('🎉 Enhanced features migration completed successfully!');
    console.log(`📈 Migration Statistics:`);
    console.log(`   - Items processed: ${itemsToUpdate.length}`);
    console.log(`   - Items updated: ${migratedCount}`);
    console.log(`   - Items skipped: ${itemsToUpdate.length - migratedCount}`);

    // Verify migration
    const totalItems = await Item.countDocuments();
    const itemsWithNewFields = await Item.countDocuments({
      reasonForSelling: { $exists: true },
      isAvailable: { $exists: true },
      images: { $exists: true },
      featuredImageIndex: { $exists: true }
    });

    console.log(`📊 Post-migration verification:`);
    console.log(`   - Total items in database: ${totalItems}`);
    console.log(`   - Items with enhanced features: ${itemsWithNewFields}`);
    console.log(`   - Migration success rate: ${((itemsWithNewFields / totalItems) * 100).toFixed(2)}%`);

    if (itemsWithNewFields === totalItems) {
      console.log('✅ All items successfully migrated with enhanced features!');
    } else {
      console.log('⚠️  Some items may still need migration. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Enhanced features migration failed:', error);
    console.error('Full error details:', error.stack);
  } finally {
    console.log('🔄 Closing database connection...');
    mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Enhanced features migration interrupted by user');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Enhanced features migration terminated');
  mongoose.connection.close();
  process.exit(0);
});
