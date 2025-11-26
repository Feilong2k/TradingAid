import express from 'express';
import Configuration from '../models/Configuration.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all configurations (public endpoint - no authentication required)
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching configurations from database...');
    
    const configurations = await Configuration.find({ isActive: true });
    
    console.log(`📊 Found ${configurations.length} configurations in database`);
    
    // Log each configuration found
    configurations.forEach(config => {
      console.log(`   - ${config.configType}: ${Array.isArray(config.configData) ? config.configData.length + ' items' : 'data loaded'}`);
    });
    
    // Transform to object by configType for easier frontend consumption
    const configByType = {};
    configurations.forEach(config => {
      configByType[config.configType] = config.configData;
    });
    
    console.log('📦 Sending configuration data to frontend:', Object.keys(configByType));
    
    res.json(configByType);
  } catch (error) {
    console.error('❌ Error fetching configurations:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
});

// Get configuration by type (public endpoint - no authentication required)
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    const configuration = await Configuration.findOne({ 
      configType: type, 
      isActive: true 
    });
    
    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    res.json(configuration.configData);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Add new asset to assets configuration (requires authentication)
router.post("/assets", authenticateToken, async (req, res) => {
  try {
    const { asset } = req.body;

    if (!asset) {
      return res.status(400).json({ error: "Asset symbol is required" });
    }

    console.log(`📝 Adding new asset: ${asset}`);
    console.log(`🔍 User: ${req.user.email}, ID: ${req.user.userId}`);

    // Find the assets configuration
    const assetsConfig = await Configuration.findOne({
      configType: "assets",
      isActive: true,
    });

    console.log(`🔍 Found assets config:`, assetsConfig ? "Yes" : "No");

    if (!assetsConfig) {
      console.log("❌ Assets configuration not found in database");
      return res.status(404).json({ error: "Assets configuration not found" });
    }

    // Check if configData is an array
    if (!Array.isArray(assetsConfig.configData)) {
      console.log(
        "❌ configData is not an array:",
        typeof assetsConfig.configData
      );
      return res
        .status(500)
        .json({ error: "configData must be an array for assets" });
    }

    console.log(`🔍 Current assets: ${assetsConfig.configData.join(", ")}`);

    // Check if asset already exists
    if (assetsConfig.configData.includes(asset)) {
      console.log(`❌ Asset already exists: ${asset}`);
      return res.status(409).json({ error: "Asset already exists" });
    }

    // Add the new asset
    assetsConfig.configData.push(asset);
    assetsConfig.updatedAt = new Date();

    // Mark the field as modified to ensure Mongoose detects the change
    assetsConfig.markModified("configData");

    console.log(`💾 Attempting to save asset to database...`);
    console.log(`📝 About to save:`, assetsConfig);

    const savedConfig = await assetsConfig.save();

    console.log(`✅ Successfully saved asset: ${asset}`);
    console.log(`📊 Updated assets: ${savedConfig.configData.join(", ")}`);
    console.log(`🆔 Saved doc _id:`, savedConfig._id);

    res.json({
      success: true,
      message: "Asset added successfully",
      assets: savedConfig.configData,
    });
  } catch (error) {
    console.error("❌ Error adding asset:", error);
    console.error("❌ Error details:", error.message);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ error: "Failed to add asset: " + error.message });
  }
});


// Reset emotions configuration to original seed data
router.post("/reset/emotions", authenticateToken, async (req, res) => {
  try {
    console.log("🔄 Resetting emotions configuration to original seed data...");

    const originalEmotions = [
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
    ];

    // Update the emotions configuration
    const emotionsConfig = await Configuration.findOneAndUpdate(
      { configType: "emotions", isActive: true },
      { 
        configData: originalEmotions,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    console.log("✅ Emotions configuration reset successfully");
    console.log(`📊 Reset emotions to ${originalEmotions.length} items`);

    res.json({
      success: true,
      message: "Emotions configuration reset to original seed data",
      emotions: emotionsConfig.configData
    });
  } catch (error) {
    console.error("❌ Error resetting emotions configuration:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset emotions configuration: " + error.message
    });
  }
});

// Update configuration (admin only - for future use)
router.put('/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { configData, version } = req.body;
    
    // For now, we'll just update the existing config
    // In the future, we might want to implement proper versioning and admin checks
    
    const configuration = await Configuration.findOneAndUpdate(
      { configType: type, isActive: true },
      { 
        configData,
        version: version || 1,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );
    
    res.json(configuration);
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

export default router;
