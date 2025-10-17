const mongoose = require('mongoose');
const Community = require('./models/Community');
require('dotenv').config();

const initialCommunities = [
  "Christ University, Koramangala",
  "Jayanagar 4th Block",
  "Indiranagar",
  "Koramangala 5th Block",
  "HSR Layout",
  "Mount Carmel College",
  "St. Joseph's University",
  "Whitefield",
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    await Community.deleteMany({ status: 'approved' });
    console.log('Cleared existing approved communities...');

    const communityDocs = initialCommunities.map(name => ({
      name,
      status: 'approved',
    }));

    await Community.insertMany(communityDocs);
    console.log('Database seeded with initial communities!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

seedDB();