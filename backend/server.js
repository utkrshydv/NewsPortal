const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const corsOptions = require('./config/corsOptions');
const newsRoutes = require('./routes/newsRoutes');
const historyRoutes = require('./routes/historyRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Connect to database
connectDB();

// Initialize the Express app
const app = express();

// Middleware setup
// Enable Cross-Origin Resource Sharing (CORS) based on configuration
app.use(cors(corsOptions));
// Parse incoming JSON payloads
app.use(express.json());

// Main Routes
app.use('/api/news', newsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/verify-news', verifyRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Configure the port
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
