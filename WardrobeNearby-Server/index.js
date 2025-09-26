const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const rentalRoutes = require('./routes/rentals');
const storyRoutes = require('./routes/stories'); // --- IMPORT STORY ROUTES ---

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/stories', storyRoutes); // --- USE STORY ROUTES ---

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running successfully on http://10.51.8.5:${PORT}`);
});