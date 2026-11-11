require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Expressing read JSON from request bodies (req.body)
app.use(express.json());

// Health-check route
app.get('/', (req, res) => {
  res.json({ message: 'ReadMore API is running' });
});

const PORT = process.env.PORT || 3000;

// Connect to MongoDB first, and only start listening if it succeeds
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });