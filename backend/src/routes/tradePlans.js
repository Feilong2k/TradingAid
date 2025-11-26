import express from 'express';
import TradePlan from '../models/TradePlan.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiService } from '../services/aiService.js';
import { validateRequest, tradePlanSchema, tradePlanUpdateSchema } from '../middleware/validation.js';

const router = express.Router();

// Get user's trade plans
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tradePlans = await TradePlan.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(tradePlans);
  } catch (error) {
    console.error('Error fetching trade plans:', error);
    res.status(500).json({ error: 'Failed to fetch trade plans' });
  }
});

// Create new trade plan
router.post('/', authenticateToken, validateRequest(tradePlanSchema), async (req, res) => {
  try {
    const { asset, direction, timeframe, emotionalState } = req.body;
    
    const tradePlan = new TradePlan({
      userId: req.user._id,
      asset,
      direction,
      timeframe,
      emotionalState,
      status: 'emotional_check'
    });
    
    await tradePlan.save();
    res.status(201).json(tradePlan);
  } catch (error) {
    console.error('Error creating trade plan:', error);
    res.status(500).json({ error: 'Failed to create trade plan' });
  }
});

// Get today's trades for AI analysis
router.get('/today-trades', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTrades = await TradePlan.find({
      userId: req.user._id,
      createdAt: { $gte: today },
      status: { $in: ['completed', 'entered'] }
    }).sort({ createdAt: -1 });
    
    res.json(todayTrades);
  } catch (error) {
    console.error('Error fetching today\'s trades:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s trades' });
  }
});

// Analyze emotional state with AI
router.post('/:id/analyze-emotions', authenticateToken, async (req, res) => {
  try {
    const { emotionalData, todayTrades } = req.body;
    
    const aiAnalysis = await aiService.analyzeEmotionalQuestionnaire(
      req.user._id.toString(),
      {
        emotionalState: emotionalData,
        todayTrades: todayTrades || []
      }
    );
    
    res.json({ aiAnalysis });
  } catch (error) {
    console.error('Error analyzing emotions:', error);
    res.status(500).json({ error: 'Failed to analyze emotional state' });
  }
});

// Update emotional state
router.patch('/:id/emotional-state', authenticateToken, async (req, res) => {
  try {
    const { emotionalState } = req.body;
    
    const tradePlan = await TradePlan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { 
        emotionalState,
        status: 'technical_analysis'
      },
      { new: true }
    );
    
    if (!tradePlan) {
      return res.status(404).json({ error: 'Trade plan not found' });
    }
    
    res.json(tradePlan);
  } catch (error) {
    console.error('Error updating emotional state:', error);
    res.status(500).json({ error: 'Failed to update emotional state' });
  }
});

// Update decision
router.patch('/:id/decision', authenticateToken, async (req, res) => {
  try {
    const { decision } = req.body;
    
    let status = 'technical_analysis';
    if (decision === 'passed') {
      status = 'passed_over';
    } else if (decision === 'take_break') {
      status = 'cancelled';
    }
    
    const tradePlan = await TradePlan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { 
        decision,
        status
      },
      { new: true }
    );
    
    if (!tradePlan) {
      return res.status(404).json({ error: 'Trade plan not found' });
    }
    
    res.json(tradePlan);
  } catch (error) {
    console.error('Error updating decision:', error);
    res.status(500).json({ error: 'Failed to update decision' });
  }
});

export default router;
