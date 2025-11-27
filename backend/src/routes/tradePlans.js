import express from 'express';
import TradePlan from '../models/TradePlan.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiService } from '../services/aiService.js';
import { validateRequest, tradePlanSchema, tradePlanUpdateSchema, emotionalStateUpdateSchema, decisionUpdateSchema } from '../middleware/validation.js';
import axios from 'axios';
import { getSystemPrompt } from '../config/aiPersonality.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

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
      status: { $in: ['open', 'emotional_check', 'technical_analysis', 'planning', 'monitoring'] }
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
    
    console.log('Fetching today trades for user:', req.user._id);
    
    const todayTrades = await TradePlan.find({
      userId: req.user._id,
      createdAt: { $gte: today },
      status: { $in: ['completed', 'entered'] }
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${todayTrades.length} trades today for user ${req.user._id}`);
    
    res.json(todayTrades);
  } catch (error) {
    console.error('Error fetching today\'s trades:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s trades' });
  }
});

// Stream chat with Aria (SSE) - persist only on [DONE]
router.post('/:id/chat/stream', authenticateToken, async (req, res) => {
  try {
    const { message, emotionalState } = req.body;

    const tradePlan = await TradePlan.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!tradePlan) {
      return res.status(404).json({ error: 'Trade plan not found' });
    }

    // Prepare historical context (last 8 messages)
    const history = (tradePlan.conversation || []).slice(-8).map(m => ({
      role: m.role,
      content: m.content
    }));

    const messages = [
      { role: 'system', content: getSystemPrompt() },
      ...history,
      { role: 'user', content: message }
    ];

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    if (!DEEPSEEK_API_KEY) {
      // Fallback when no API key: send a short canned response, then DONE
      const canned = "Let's focus on your emotional state. What's the strongest feeling you notice right now, and what simple step could help ease it?";
      res.write(`data: ${JSON.stringify({ delta: canned })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      // Do not persist without real streaming completion
      return res.end();
    }

    const upstream = await axios.post(
      `${DEEPSEEK_BASE_URL}/chat/completions`,
      {
        model: 'deepseek-reasoner',
        messages,
        stream: true
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 0
      }
    );

    let fullText = '';
    let sawDone = false;

    upstream.data.on('data', (chunk) => {
      const lines = chunk.toString('utf8').split('\n').filter(Boolean);
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice('data:'.length).trim();
        if (payload === '[DONE]') {
          sawDone = true;
          res.write(`data: [DONE]\n\n`);
          // Persist both user and assistant messages only after DONE
          (async () => {
            try {
              tradePlan.conversation = tradePlan.conversation || [];
              tradePlan.conversation.push({
                role: 'user',
                content: message,
                timestamp: new Date()
              });
              tradePlan.conversation.push({
                role: 'assistant',
                content: fullText,
                timestamp: new Date()
              });
              await tradePlan.save();
            } catch (e) {
              console.error('Error saving streamed conversation:', e);
            } finally {
              if (!res.writableEnded) res.end();
            }
          })();
          return;
        }
        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            fullText += delta;
            res.write(`data: ${JSON.stringify({ delta })}\n\n`);
          }
        } catch (e) {
          // Ignore malformed lines / heartbeats
        }
      }
    });

    upstream.data.on('end', () => {
      if (!sawDone) {
        // Upstream ended without DONE; don't persist
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: 'stream_ended' })}\n\n`);
          res.write(`data: [DONE]\n\n`);
          res.end();
        }
      }
    });

    upstream.data.on('error', (err) => {
      console.error('DeepSeek stream error:', err?.message || err);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: 'stream_error' })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
      }
    });
  } catch (error) {
    console.error('Error in chat stream:', {
      message: error.message,
      stack: error.stack,
      tradePlanId: req.params.id,
      userId: req.user?._id
    });
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to start chat stream' });
    }
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'route_error' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  }
});

// Get single trade plan by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const tradePlan = await TradePlan.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!tradePlan) {
      return res.status(404).json({ error: 'Trade plan not found' });
    }
    
    res.json(tradePlan);
  } catch (error) {
    console.error('Error fetching trade plan:', error);
    res.status(500).json({ error: 'Failed to fetch trade plan' });
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
      
      // Ensure conversation array exists before pushing
      if (!tradePlan.conversation) {
        tradePlan.conversation = [];
      }
      
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
    
    // Ensure conversation array exists before pushing
    if (!tradePlan.conversation) {
      tradePlan.conversation = [];
    }
    
    // Save user message to conversation
    tradePlan.conversation.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // Get AI response based on current emotional state and conversation context
    let aiResponse;
    try {
      aiResponse = await aiService.analyzeChatMessage(
        req.user._id.toString(),
        message,
        emotionalState,
        tradePlan.conversation
      );
    } catch (aiError) {
      console.error('AI service error in chat:', aiError);
      // Provide a graceful fallback response when AI service fails
      aiResponse = "I'm experiencing some technical difficulties right now, but let's continue with our emotional check. How are you feeling about this trade opportunity?";
    }
    
    // Ensure response is not truncated - add minimum length check
    if (aiResponse && aiResponse.length < 50) {
      console.warn('AI response seems truncated, adding follow-up:', aiResponse);
      aiResponse += " Let's continue exploring this together. What else are you noticing about how you're feeling?";
    }
    
    // Return AI response immediately without saving to database
    // The frontend will handle streaming and then save the complete message separately
    res.json({ aiResponse });
    
    // Save AI response to conversation in background after response is sent
    // This avoids blocking the response and allows frontend to start streaming immediately
    setTimeout(async () => {
      try {
        tradePlan.conversation.push({
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        });
        await tradePlan.save();
        console.log('AI response saved to conversation');
      } catch (saveError) {
        console.error('Error saving AI response to conversation:', saveError);
      }
    }, 100);
    
  } catch (error) {
    console.error('Error in chat:', {
      message: error.message,
      stack: error.stack,
      tradePlanId: req.params.id,
      userId: req.user._id
    });
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

// Delete trade plan
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const tradePlan = await TradePlan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!tradePlan) {
      return res.status(404).json({ error: 'Trade plan not found' });
    }
    
    res.json({ message: 'Trade plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting trade plan:', error);
    res.status(500).json({ error: 'Failed to delete trade plan' });
  }
});

// Update decision
router.patch('/:id/decision', authenticateToken, validateRequest(decisionUpdateSchema), async (req, res) => {
  try {
    const { decision } = req.body;
    
    let status;
    if (decision === 'passed') {
      status = 'passed_over';
    } else if (decision === 'take_break') {
      // Don't change status - leave it on emotional_check
      status = undefined;
    } else {
      status = 'technical_analysis';
    }
    
    const updateFields = { decision };
    if (status) {
      updateFields.status = status;
    }
    
    const tradePlan = await TradePlan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateFields,
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
