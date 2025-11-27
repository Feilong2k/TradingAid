import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ApiKey from '../models/ApiKey.js';

// Load env
dotenv.config();

const mongooseOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority',
};

async function seedApiKey() {
  let exitCode = 0;
  try {
    const { MONGODB_URI, MT5_API_KEY, DEFAULT_USER_ID, NODE_ENV } = process.env;

    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not set in environment');
      process.exit(1);
    }

    if (!MT5_API_KEY || !DEFAULT_USER_ID) {
      console.error('❌ MT5_API_KEY and DEFAULT_USER_ID must be set in environment');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('✅ Connected');

    // Upsert mapping for MT5_API_KEY -> DEFAULT_USER_ID
    const update = {
      userId: DEFAULT_USER_ID,
      label: `MT5 EA (${NODE_ENV || 'development'})`,
      isActive: true,
    };

    const result = await ApiKey.findOneAndUpdate(
      { apiKey: MT5_API_KEY },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    console.log('✅ ApiKey mapping ensured:');
    console.log({
      apiKey: result.apiKey,
      userId: result.userId,
      isActive: result.isActive,
      id: result._id?.toString?.(),
    });
  } catch (err) {
    console.error('❌ Seed ApiKey error:', err);
    exitCode = 1;
  } finally {
    try {
      await mongoose.connection.close();
      console.log('🔌 Connection closed');
    } catch (err) {
      console.error('Error closing connection:', err);
    }
    process.exit(exitCode);
  }
}

if (process.argv[1] && process.argv[1].endsWith('seedApiKey.js')) {
  seedApiKey();
}

export default seedApiKey;
