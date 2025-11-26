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
