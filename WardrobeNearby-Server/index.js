const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items'); // --- IMPORT ITEM ROUTES ---

const app = express();
const PORT = process.env.PORT || 3000;

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes); // --- USE ITEM ROUTES ---

app.get('/', (req, res) => {
  res.send('Hello from the Wardrobe Nearby Server!');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running successfully on http://localhost:${PORT}`);
});