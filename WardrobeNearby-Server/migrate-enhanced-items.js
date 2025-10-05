const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log(' Connected to MongoDB for enhanced item migration');
    migrateEnhancedItems();
  })
  .catch(err => {
    console.error(' MongoDB connection error:', err);
    process.exit(1);
  });

const Item = require('./models/Item');

async function migrateEnhancedItems() {
  try {
    console.log('🔄 Starting enhanced item migration...');
    
    // Find items that don't have the new fields
    const itemsToMigrate = await Item.find({
      $or: [
        { listingType: { $exists: false } },
        { rentalDuration: { $exists: false } }
      ]
    });
    
    console.log(` Found ${itemsToMigrate.length} items to migrate for enhanced features`);
    
    let migratedCount = 0;
    
    for (const item of itemsToMigrate) {
      try {
        // Add default values for new fields
        const updateData = {};
        
        if (!item.listingType) {
          updateData.listingType = 'rent'; // Default to rent
        }
        
        if (!item.rentalDuration) {
          updateData.rentalDuration = 'per day'; // Default to per day
        }
        
        if (Object.keys(updateData).length > 0) {
          await Item.findByIdAndUpdate(item._id, updateData);
          migratedCount++;
          console.log(` Updated item: ${item.name} with enhanced features`);
        }
      } catch (error) {
        console.error(` Error updating item ${item._id}:`, error);
      }
    }
    
    console.log(`🎉 Enhanced migration complete! Migrated ${migratedCount} out of ${itemsToMigrate.length} items`);
    
    // Verify migration
    const verifyItems = await Item.find({
      $and: [
        { listingType: { $exists: true } },
        { rentalDuration: { $exists: true } }
      ]
    }).countDocuments();
    
    console.log(` Verification: ${verifyItems} items now have enhanced features`);
    
  } catch (error) {
    console.error(' Enhanced migration error:', error);
  } finally {
    mongoose.connection.close();
    console.log(' Database connection closed');
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n  Enhanced migration interrupted');
  mongoose.connection.close();
  process.exit(0);
});
