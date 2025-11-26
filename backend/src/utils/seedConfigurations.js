import mongoose from 'mongoose';
import Configuration from '../models/Configuration.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initial configuration data from the development plan
const initialConfigurations = [
  {
    configType: 'assets',
    configData: ['BTC', 'NQ', 'GBPUSD', 'USDJPY', 'GOLD', 'JP225'],
    isActive: true
  },
  {
    configType: 'timeframes',
    configData: [
      {
        label: 'M15, M5, M1',
        timeframes: ['M15', 'M5', 'M1'],
        description: 'Short-term analysis set'
      },
      {
        label: 'H1, M15, M5', 
        timeframes: ['H1', 'M15', 'M5'],
        description: 'Medium-term analysis set'
      },
      {
        label: 'H4, H1, M15',
        timeframes: ['H4', 'H1', 'M15'],
        description: 'Long-term analysis set'
      }
    ],
    isActive: true
  },
  {
    configType: 'emotions',
    configData: [
      { value: 'calm', label: 'Calm', type: 'positive' },
      { value: 'focused', label: 'Focused', type: 'positive' },
      { value: 'confident', label: 'Confident', type: 'positive' },
      { value: 'anxious', label: 'Anxious', type: 'negative' },
      { value: 'rushed', label: 'Rushed', type: 'negative' },
      { value: 'fearful', label: 'Fearful', type: 'negative' },
      { value: 'hopeful', label: 'Hopeful', type: 'negative' },
      { value: 'excited', label: 'Excited', type: 'negative' },
      { value: 'greedy', label: 'Greedy', type: 'negative' },
      { value: 'irritated', label: 'Irritated', type: 'negative' },
      { value: 'frustrated', label: 'Frustrated', type: 'negative' },
      { value: 'angry', label: 'Angry', type: 'negative' },
      { value: 'disappointed', label: 'Disappointed', type: 'negative' },
      { value: 'regretful', label: 'Regretful', type: 'negative' },
      { value: 'ashamed', label: 'Ashamed', type: 'negative' }
    ],
    isActive: true
  },
  {
    configType: 'body_signals',
    configData: [
      { category: 'stress', signal: 'Tight shoulders, neck jaw' },
      { category: 'stress', signal: 'Clenched fists or teeth' },
      { category: 'stress', signal: 'Short, shallow breathing' },
      { category: 'stress', signal: 'Rapid heart rate' },
      { category: 'fomo', signal: 'Restless legs' },
      { category: 'fomo', signal: 'Urge to click button impulsively' },
      { category: 'fomo', signal: 'Sense of I have to do something now' },
      { category: 'anger', signal: 'Tight stomach, or chest' },
      { category: 'anger', signal: 'Heavy breathing or sighing' },
      { category: 'anger', signal: 'Sudden movements or harsh mouse clicks' },
      { category: 'fear', signal: 'Cold hands' },
      { category: 'fear', signal: 'Sinking feeling in stomach' },
      { category: 'fear', signal: 'Hesitating on entries or exits' },
      { category: 'fear', signal: 'Holding breath' },
      { category: 'greed', signal: 'Feeling invincible or overly confident' },
      { category: 'greed', signal: 'Fast breathing, energy spike' },
      { category: 'greed', signal: 'Grinning or leaning forward eagerly' },
      { category: 'greed', signal: 'Ignoring plan or over leveraging' },
      { category: 'greed', signal: 'Changing Profit target' }
    ],
    isActive: true
  }
];

// MongoDB connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  w: "majority",
};

const seedConfigurations = async () => {
  try {
    console.log('🌱 Starting configuration seeding...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/tradingapp');
    
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tradingapp", mongooseOptions);
    console.log('✅ Connected to MongoDB');

    // Check if we can access the database
    const db = mongoose.connection.db;
    console.log('📊 Database name:', db.databaseName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));

    // Clear existing configurations
    console.log('🗑️  Clearing existing configurations...');
    const deleteResult = await Configuration.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} configurations`);

    // Insert new configurations
    console.log('📝 Inserting new configurations...');
    console.log('Number of configurations to insert:', initialConfigurations.length);
    
    const result = await Configuration.insertMany(initialConfigurations);
    console.log(`✅ Successfully seeded ${result.length} configurations`);

    // Verify the insert worked
    console.log('🔍 Verifying inserted data...');
    const insertedConfigs = await Configuration.find({});
    console.log(`📊 Found ${insertedConfigs.length} configurations in database after insert`);
    
    // Display seeded data
    console.log('\n📋 Seeded Configuration Types:');
    insertedConfigs.forEach(config => {
      console.log(`   - ${config.configType}: ${Array.isArray(config.configData) ? config.configData.length + ' items' : 'data loaded'}`);
      console.log(`     isActive: ${config.isActive}, _id: ${config._id}`);
    });

    console.log('\n🎉 Configuration seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding configurations:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedConfigurations();
}

export default seedConfigurations;
