const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB for migration');
    migrateItems();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const Item = require('./models/Item');

async function migrateItems() {
  try {
    console.log('🔄 Starting item migration...');
    
    // Find items that don't have the new images array
    const itemsToMigrate = await Item.find({
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } },
        { featuredImageIndex: { $exists: false } }
      ]
    });
    
    console.log(`📦 Found ${itemsToMigrate.length} items to migrate`);
    
    let migratedCount = 0;
    
    for (const item of itemsToMigrate) {
      try {
        // Create images array from existing imageUrl if it doesn't exist
        if (!item.images || item.images.length === 0) {
          item.images = [item.imageUrl];
        }
        
        // Set featuredImageIndex if it doesn't exist
        if (item.featuredImageIndex === undefined) {
          item.featuredImageIndex = 0;
        }
        
        await item.save();
        migratedCount++;
        
        if (migratedCount % 10 === 0) {
          console.log(`✅ Migrated ${migratedCount} items...`);
        }
      } catch (error) {
        console.error(`❌ Error migrating item ${item._id}:`, error.message);
      }
    }
    
    console.log(`🎉 Migration complete! Migrated ${migratedCount} out of ${itemsToMigrate.length} items`);
    
    // Verify migration
    const updatedItems = await Item.countDocuments({
      images: { $exists: true, $ne: [] },
      featuredImageIndex: { $exists: true }
    });
    
    console.log(`✅ Verification: ${updatedItems} items now have the new image format`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Migration interrupted');
  mongoose.connection.close();
  process.exit(0);
});
