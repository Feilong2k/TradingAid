import mongoose from "mongoose";
import Configuration from "../models/Configuration.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Initial configuration data from the development plan
const initialConfigurations = [
  {
    configType: "assets",
    configData: ["BTC", "NQ", "GBPUSD", "USDJPY", "GOLD", "JP225"],
    isActive: true,
  },
  {
    configType: "timeframes",
    configData: [
      {
        label: "M15, M5, M1",
        timeframes: ["M15", "M5", "M1"],
        description: "Short-term analysis set",
      },
      {
        label: "H1, M15, M5",
        timeframes: ["H1", "M15", "M5"],
        description: "Medium-term analysis set",
      },
      {
        label: "H4, H1, M15",
        timeframes: ["H4", "H1", "M15"],
        description: "Long-term analysis set",
      },
    ],
    isActive: true,
  },
  {
    configType: "emotions",
    configData: [
      { value: "calm", label: "Calm", type: "positive" },
      { value: "focused", label: "Focused", type: "positive" },
      { value: "confident", label: "Confident", type: "positive" },
      { value: "anxious", label: "Anxious", type: "negative" },
      { value: "rushed", label: "Rushed", type: "negative" },
      { value: "fearful", label: "Fearful", type: "negative" },
      { value: "hopeful", label: "Hopeful", type: "negative" },
      { value: "excited", label: "Excited", type: "negative" },
      { value: "greedy", label: "Greedy", type: "negative" },
      { value: "irritated", label: "Irritated", type: "negative" },
      { value: "frustrated", label: "Frustrated", type: "negative" },
      { value: "angry", label: "Angry", type: "negative" },
      { value: "disappointed", label: "Disappointed", type: "negative" },
      { value: "regretful", label: "Regretful", type: "negative" },
      { value: "ashamed", label: "Ashamed", type: "negative" },
    ],
    isActive: true,
  },
  {
    configType: "body_signals",
    configData: [
      { category: "stress", signal: "Tight shoulders, neck jaw" },
      { category: "stress", signal: "Clenched fists or teeth" },
      { category: "stress", signal: "Short, shallow breathing" },
      { category: "stress", signal: "Rapid heart rate" },
      { category: "fomo", signal: "Restless legs" },
      { category: "fomo", signal: "Urge to click button impulsively" },
      { category: "fomo", signal: "Sense of I have to do something now" },
      { category: "anger", signal: "Tight stomach, or chest" },
      { category: "anger", signal: "Heavy breathing or sighing" },
      { category: "anger", signal: "Sudden movements or harsh mouse clicks" },
      { category: "fear", signal: "Cold hands" },
      { category: "fear", signal: "Sinking feeling in stomach" },
      { category: "fear", signal: "Hesitating on entries or exits" },
      { category: "fear", signal: "Holding breath" },
      { category: "greed", signal: "Feeling invincible or overly confident" },
      { category: "greed", signal: "Fast breathing, energy spike" },
      { category: "greed", signal: "Grinning or leaning forward eagerly" },
      { category: "greed", signal: "Ignoring plan or over leveraging" },
      { category: "greed", signal: "Changing Profit target" },
    ],
    isActive: true,
  },
];
const mongooseOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  w: "majority",
};

const seedConfigurations = async () => {
  let exitCode = 0;
  try {
    console.log("🔗 Connecting to MongoDB...", process.env.MONGODB_URI);
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/tradingapp",
      mongooseOptions
    );
    console.log("✅ Connected");

    const deleteResult = await Configuration.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount}`);

    const result = await Configuration.insertMany(initialConfigurations);
    console.log(`✅ Inserted ${result.length}`);

    const inserted = await Configuration.find({});
    console.log("📊 After insert:", inserted.length);
  } catch (err) {
    console.error("❌ Seed error:", err);
    exitCode = 1;
  } finally {
    try {
      await mongoose.connection.close();
      console.log("🔌 Connection closed");
    } catch (err) {
      console.error("Error closing connection:", err);
    }
    process.exit(exitCode);
  }
};

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  seedConfigurations();
}

export default seedConfigurations;
