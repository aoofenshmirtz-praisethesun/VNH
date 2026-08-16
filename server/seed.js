const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const User = require('./models/User');
const MonthlyRecord = require('./models/MonthlyRecord');

const runSeed = async () => {
  try {
    await connectDB();
    console.log('[Seed] Starting database seed...');

    // 1. Seed demo user nmcworker1 / password123
    await User.deleteMany({});
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    const demoUser = await User.create({
      username: 'nmcworker1',
      passwordHash,
      role: 'nmc_worker'
    });
    console.log(`[Seed] Demo worker account created: ${demoUser.username}`);

    // 2. Clear monthlyrecords collection
    await MonthlyRecord.deleteMany({});
    console.log('[Seed] Cleared existing monthlyrecords collection.');

    // 3. Read json seed file
    const seedFilePath = path.join(__dirname, 'data/monthly_records_seed.json');
    if (!fs.existsSync(seedFilePath)) {
      throw new Error(`Seed file not found at: ${seedFilePath}`);
    }

    const rawData = fs.readFileSync(seedFilePath, 'utf-8');
    const records = JSON.parse(rawData);

    // Normalize records to schema format
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

    const inserted = await MonthlyRecord.insertMany(formattedRecords);
    console.log(`[Seed] Successfully inserted ${inserted.length} total monthly records!`);

    // 4. Log count grouped by zone
    const zoneCounts = {};
    inserted.forEach(r => {
      zoneCounts[r.zone] = (zoneCounts[r.zone] || 0) + 1;
    });

    console.log('[Seed] Records inserted per zone:');
    console.table(zoneCounts);

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
};

runSeed();
