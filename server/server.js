const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load root .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const zoneRoutes = require('./routes/zones');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/zones', zoneRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'NeerNetra NMC Water Monitoring API', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

// Connect Database & Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🌊 NeerNetra Server running on http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});
