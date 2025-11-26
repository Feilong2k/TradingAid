import express from 'express';
import TradePlan from '../models/TradePlan.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiService } from '../services/aiService.js';
import { validateRequest, tradePlanSchema, tradePlanUpdateSchema, emotionalStateUpdateSchema, decisionUpdateSchema } from '../middleware/validation.js';

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

// Get open trade plans
router.get('/open', authenticateToken, async (req, res) => {
  try {
    const openTradePlans = await TradePlan.find({ 
      userId: req.user._id,
      status: 'open'
    }).sort({ createdAt: -1 });
    
    res.json(openTradePlans);
  } catch (error) {
    console.error('Error fetching open trade plans:', error);
    res.status(500).json({ error: 'Failed to fetch open trade plans' });
  }
});

// Get active trade plans for ActiveTrades page
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const activeTradePlans = await TradePlan.find({ 
      userId: req.user._id,
      status: { $in: ['open', 'emotional_check', 'technical_analysis', 'planning', 'monitoring', 'entered'] }
    }).sort({ createdAt: -1 });
    
    // Separate into open positions and monitoring opportunities
    const openPositions = activeTradePlans.filter(plan => 
      plan.status === 'entered'
    );
    
    const monitoringOpportunities = activeTradePlans.filter(plan => 
      ['open', 'emotional_check', 'technical_analysis', 'planning', 'monitoring'].includes(plan.status)
    );
    
    res.json({
      openPositions,
      monitoringOpportunities
    });
  } catch (error) {
    console.error('Error fetching active trade plans:', error);
    res.status(500).json({ error: 'Failed to fetch active trade plans' });
  }
});

// Create new trade plan
router.post('/', authenticateToken, validateRequest(tradePlanSchema), async (req, res) => {
  try {
    const { asset, direction, timeframe, emotionalState } = req.body;
    
    // Normalize timeframe if it comes in M/H format (e.g., M15 -> 15m, H1 -> 1h)
    let normalizedTimeframe = timeframe;
    if (/^[MH]\d+$/i.test(timeframe)) {
      const match = timeframe.match(/^([MH])(\d+)$/i);
      if (match) {
        const unit = match[1].toUpperCase() === 'M' ? 'm' : 'h';
        normalizedTimeframe = `${match[2]}${unit}`;
      }
    }
    
    const tradePlan = new TradePlan({
      userId: req.user._id,
      asset,
      direction,
      timeframe: normalizedTimeframe,
      emotionalState,
      status: 'open'
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

// Analyze trading context and prompt for emotional check-in
router.post('/:id/analyze-emotions', authenticateToken, async (req, res) => {
  try {
    const { emotionalData, todayTrades } = req.body;
    
    // Get the trade plan to analyze context
    const tradePlan = await TradePlan.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!tradePlan) {
      return res.status(404).json({ error: 'Trade plan not found' });
    }
    
    // If no emotional state is selected yet, provide trading context check-in
    if (!emotionalData.state) {
      const aiAnalysis = await aiService.analyzeTradingContext(
        req.user._id.toString(),
        tradePlan,
        todayTrades || []
      );
      
      // Save initial AI message to conversation
      tradePlan.conversation.push({
        role: 'assistant',
        content: aiAnalysis,
        timestamp: new Date()
      });
      await tradePlan.save();
      
      return res.json({ aiAnalysis });
    }
    
    // If emotional state is provided, analyze the questionnaire
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

// Chat with Aria for emotional check
router.post('/:id/chat', authenticateToken, async (req, res) => {
  try {
    const { message, emotionalState } = req.body;
    
    // Get the trade plan
    const tradePlan = await TradePlan.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!tradePlan) {
      return res.status(404).json({ error: 'Trade plan not found' });
    }
    
    // Save user message to conversation
    tradePlan.conversation.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // Get AI response based on current emotional state and conversation context
    const aiResponse = await aiService.analyzeChatMessage(
      req.user._id.toString(),
      message,
      emotionalState,
      tradePlan.conversation
    );
    
    // Save AI response to conversation
    tradePlan.conversation.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });
    
    await tradePlan.save();
    
    res.json({ aiResponse });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Update emotional state
router.patch('/:id/emotional-state', authenticateToken, validateRequest(emotionalStateUpdateSchema), async (req, res) => {
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
router.patch('/:id/decision', authenticateToken, validateRequest(decisionUpdateSchema), async (req, res) => {
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
