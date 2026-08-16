const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neernetra';
  try {
    // Attempt standard connection with 3 sec timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Database] Connected to MongoDB at: ${uri}`);
  } catch (err) {
    console.warn(`[Database] Could not connect to primary MongoDB at ${uri} (${err.message}).`);
    console.log(`[Database] Initializing MongoMemoryServer fallback...`);
    try {
      mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await mongoose.connect(memUri);
      console.log(`[Database] Connected to MongoMemoryServer at: ${memUri}`);
    } catch (memErr) {
      console.error(`[Database] MongoMemoryServer error:`, memErr);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
