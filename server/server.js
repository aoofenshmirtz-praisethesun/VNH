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
connectDB().then(async () => {
  // Check if auto-seed is required
  try {
    const User = require('./models/User');
    const MonthlyRecord = require('./models/MonthlyRecord');
    const userCount = await User.countDocuments();
    const recordCount = await MonthlyRecord.countDocuments();

    if (userCount === 0 || recordCount === 0) {
      console.log('[AutoSeed] Empty database detected. Seeding initial data...');
      const bcrypt = require('bcryptjs');
      const fs = require('fs');

      if (userCount === 0) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);
        await User.create({
          username: 'nmcworker1',
          passwordHash,
          role: 'nmc_worker'
        });
        console.log('[AutoSeed] Created demo worker account: nmcworker1');
      }

      if (recordCount === 0) {
        const seedFilePath = path.join(__dirname, 'data/monthly_records_seed.json');
        if (fs.existsSync(seedFilePath)) {
          const rawData = fs.readFileSync(seedFilePath, 'utf-8');
          const records = JSON.parse(rawData);
          const formattedRecords = records.map(r => ({
            zone: r.zone,
            month: r.month,
            mld_supplied: Number(r.mld_supplied),
            nrw_pct: Number(r.nrw_pct),
            tanker_count: Number(r.tanker_count),
            supply_hrs_real: r.supply_hrs_real || 'UNKNOWN',
            uploaded_by: r.uploaded_by || 'seed_script',
            is_synthetic: r.is_synthetic !== undefined ? Boolean(r.is_synthetic) : true
          }));
          await MonthlyRecord.insertMany(formattedRecords);
          console.log(`[AutoSeed] Inserted ${formattedRecords.length} monthly records.`);
        }
      }
    }
  } catch (seedErr) {
    console.error('[AutoSeed] Error during auto-seeding:', seedErr);
  }

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🌊 NeerNetra Server running on http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});

