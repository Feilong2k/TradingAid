import express from 'express';
import TradePlan from '../models/TradePlan.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiService } from '../services/aiService.js';
import { validateRequest, tradePlanSchema, tradePlanUpdateSchema, emotionalStateUpdateSchema, decisionUpdateSchema } from '../middleware/validation.js';
import axios from 'axios';
import { getSystemPrompt } from '../config/aiPersonality.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

const DEBUG = process.env.NODE_ENV !== 'production' && process.env.DEBUG !== 'false';
const dlog = (...args) => { if (DEBUG) console.log(...args); };

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
    
    dlog('Fetching today trades for user:', req.user._id);
    
    const todayTrades = await TradePlan.find({
      userId: req.user._id,
      createdAt: { $gte: today },
      status: { $in: ['completed', 'entered'] }
    }).sort({ createdAt: -1 });
    
    dlog(`Found ${todayTrades.length} trades today for user ${req.user._id}`);
    
    res.json(todayTrades);
  } catch (error) {
    console.error('Error fetching today\'s trades:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s trades' });
  }
});

// Stream chat with Aria (SSE) - persist only on [DONE]
router.post('/:id/chat/stream', authenticateToken, async (req, res) => {
  dlog('BACKEND: Starting stream chat endpoint', {
    tradePlanId: req.params.id,
    userId: req.user._id,
    messageLength: req.body.message?.length,
    hasEmotionalState: !!req.body.emotionalState
  });

  try {
    const { message, emotionalState, todayTrades } = req.body;

    const tradePlan = await TradePlan.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!tradePlan) {
      dlog('BACKEND: Trade plan not found');
      return res.status(404).json({ error: 'Trade plan not found' });
    }

    // Prepare historical context (last 8 messages)
    const history = (tradePlan.conversation || []).slice(-8).map(m => ({
      role: m.role,
      content: m.content
    }));

    // Build contextual system note for Aria (emotional state + today's trades, if provided)
    const contextLines = [];
    if (emotionalState?.state) {
      const signals = Array.isArray(emotionalState.bodySignals)
        ? emotionalState.bodySignals
            .filter(s => s && s.signal)
            .map(s => `${s.signal} (${s.intensity}/10)`)
        : [];
      let line = `Current emotion: ${emotionalState.state}`;
      if (signals.length) line += `; Body signals: ${signals.join(', ')}`;
      if (emotionalState.notes) line += `; Notes: ${emotionalState.notes}`;
      contextLines.push(line);
    }
    if (Array.isArray(todayTrades)) {
      const total = todayTrades.length;
      const entered = todayTrades.filter(t => t.status === 'entered').length;
      const completed = todayTrades.filter(t => t.status === 'completed').length;
      contextLines.push(`Today's trades summary: total ${total}, open ${entered}, completed ${completed}, firstTradeOfDay: ${total === 0 ? 'yes' : 'no'}.`);
    }

    let messages = [{ role: 'system', content: getSystemPrompt() }];
    if (contextLines.length) {
      messages.push({
        role: 'system',
        content: `Context for emotional check:\n${contextLines.join('\n')}\nKeep responses focused on emotions and coping strategies. Do not discuss technical analysis at this stage.`
      });
    }
    messages = [
      ...messages,
      ...history,
      { role: 'user', content: message }
    ];

    dlog('BACKEND: Prepared messages for AI, count:', messages.length);

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    if (!DEEPSEEK_API_KEY) {
      dlog('BACKEND: No DEEPSEEK_API_KEY, using fallback response');
      // Fallback when no API key: send a short canned response, then DONE
      const canned = "Let's focus on your emotional state. What's the strongest feeling you notice right now, and what simple step could help ease it?";
      res.write(`data: ${JSON.stringify({ delta: canned })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      // Do not persist without real streaming completion
      return res.end();
    }

    dlog('BACKEND: Making request to DeepSeek API...');
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

    dlog('BACKEND: DeepSeek API connected, starting stream processing');
    let fullText = '';
    let sawDone = false;
    let tokenCount = 0;

    upstream.data.on('data', (chunk) => {
      const lines = chunk.toString('utf8').split('\n').filter(Boolean);
      dlog(`BACKEND: Received ${lines.length} lines from DeepSeek`);
      
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice('data:'.length).trim();
        
        if (payload === '[DONE]') {
          dlog('BACKEND: Received [DONE] from DeepSeek, stream complete');
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
              dlog('BACKEND: Saved conversation to database');
            } catch (e) {
              console.error('BACKEND: Error saving streamed conversation:', e);
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
            tokenCount++;
            fullText += delta;
            if (tokenCount <= 3 || tokenCount % 10 === 0) {
              dlog(`BACKEND: Token ${tokenCount}: "${delta}"`);
            }
            res.write(`data: ${JSON.stringify({ delta })}\n\n`);
          }
        } catch (e) {
          // Ignore malformed lines / heartbeats
          dlog('BACKEND: Ignoring malformed line:', e.message);
        }
      }
    });

    upstream.data.on('end', () => {
      dlog('BACKEND: Upstream stream ended, sawDone:', sawDone);
      if (!sawDone) {
        // Upstream ended without DONE; don't persist
        if (!res.writableEnded) {
          dlog('BACKEND: Stream ended without [DONE]');
          res.write(`data: ${JSON.stringify({ error: 'stream_ended' })}\n\n`);
          res.write(`data: [DONE]\n\n`);
          res.end();
        }
      }
    });

    upstream.data.on('error', (err) => {
      console.error('BACKEND: DeepSeek stream error:', err?.message || err);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: 'stream_error' })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
      }
    });
  } catch (error) {
    console.error('BACKEND: Error in chat stream:', {
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
    const { message, emotionalState, todayTrades } = req.body;
    
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
        tradePlan.conversation,
        todayTrades || []
      );
    } catch (aiError) {
      console.error('AI service error in chat:', aiError);
      // Provide a graceful fallback response when AI service fails
      aiResponse = "I'm experiencing some technical difficulties right now, but let's continue with our emotional check. How are you feeling about this trade opportunity?";
    }
    
    // Ensure response is not truncated - add minimum length check
    if (aiResponse && aiResponse.length < 50) {
      dlog('AI response seems truncated, adding follow-up:', aiResponse);
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
        dlog('AI response saved to conversation');
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

// Update trade plan status
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    const tradePlan = await TradePlan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status },
      { new: true }
    );
    
    if (!tradePlan) {
      return res.status(404).json({ error: 'Trade plan not found' });
    }
    
    res.json(tradePlan);
  } catch (error) {
    console.error('Error updating trade plan status:', error);
    res.status(500).json({ error: 'Failed to update trade plan status' });
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

// Grade calculation mapping for technical elements
const gradeMapping = {
  // Trend grades
  trend: {
    'up_trending_above_ma': 2,
    'up_consolidation': 1,
    'down_trending_below_ma': -2,
    'down_consolidation': -1,
    'unclear': 0
  },
  // CHoCH grades
  choch: {
    'no_change': 0,
    'up_trend_broken': -1,
    'down_trend_broken': 1,
    'up_confirmed_not_verified': 2,
    'down_confirmed_not_verified': -2,
    'up_verified_not_confirmed': 2,
    'down_verified_not_confirmed': -2,
    'up_confirmed_verified': 3,
    'down_confirmed_verified': -3
  },
  // Divergence grades
  divergence: {
    'none': 0,
    'five_waves_up_divergence': -2,
    'five_waves_down_divergence': 2,
    'three_waves_up_divergence': -1,
    'three_waves_down_divergence': 1
  },
  // Stochastics grades
  stochastics: {
    'oversold': 1,
    'overbought': -1,
    'moving_up': 1,
    'moving_down': -1,
    'directionless': 0,
    'divergence_overbought': -1,
    'divergence_oversold': 1
  },
  // Time Criteria grades
  timeCriteria: {
    'uptrend_consolidation_met': 1,
    'downtrend_consolidation_met': -1,
    'uptrend_time_not_over': 1,
    'downtrend_time_not_over': -1,
    'consolidation_not_met': 0,
    'trend_time_over': 0,
    'not_valid': 0
  },
  // ATR Analysis grades
  atrAnalysis: {
    'up_candle_high': 2,
    'down_candle_high': -2,
    'up_candle_medium': 1,
    'down_candle_medium': -1,
    'low': 0
  },
  // Moving Averages grades
  movingAverages: {
    'crossing_up': 2,
    'fanning_up': 1,
    'crossing_down': -2,
    'fanning_down': -1,
    'unclear': 0
  }
};

// Calculate grades and directional bias for analysis entry
function calculateAnalysisGrades(analysisEntry) {
  const grades = {};
  let totalGrade = 0;
  
  // Calculate individual element grades
  for (const [element, selection] of Object.entries(analysisEntry)) {
    if (gradeMapping[element] && selection) {
      grades[element] = gradeMapping[element][selection] || 0;
      totalGrade += grades[element];
    }
  }
  
  // Determine directional bias
  let directionalBias = 'unclear';
  if (totalGrade > 5) {
    directionalBias = 'long';
  } else if (totalGrade < -5) {
    directionalBias = 'short';
  }
  
  return { grades, totalGrade, directionalBias };
}

// Create new analysis entry
router.post('/:id/analysis-entries', authenticateToken, async (req, res) => {
  try {
    const { timeframe, trend, choch, divergence, stochastics, timeCriteria, atrAnalysis, movingAverages, notes, screenshots } = req.body;
    
    // Find the trade plan
    const tradePlan = await TradePlan.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!tradePlan) {
      return res.status(404).json({ error: 'Trade plan not found' });
    }
    
    // Enforce HTF single-entry constraint
    if (timeframe === 'HTF') {
      const existingHTF = tradePlan.analysisEntries.find(entry => entry.timeframe === 'HTF');
      if (existingHTF) {
        return res.status(400).json({ error: 'Only one HTF analysis entry allowed per trade plan' });
      }
    }
    
    // Create analysis entry with calculated grades
    const analysisEntry = {
      timeframe,
      trend,
      choch,
      divergence,
      stochastics,
      timeCriteria,
      atrAnalysis,
      movingAverages,
      notes,
      screenshots: screenshots || []
    };
    
    // Calculate grades and directional bias
    const { grades, totalGrade, directionalBias } = calculateAnalysisGrades(analysisEntry);
    
    // Add the analysis entry to the trade plan
    tradePlan.analysisEntries.push({
      ...analysisEntry,
      ...grades,
      totalGrade,
      directionalBias
    });
    
    await tradePlan.save();
    
    // Return the newly created analysis entry
    const newEntry = tradePlan.analysisEntries[tradePlan.analysisEntries.length - 1];
    
    // Generate Aria technical assessment in background
    setTimeout(async () => {
      try {
        const assessment = await aiService.generateTechnicalAssessment(
          req.user._id.toString(),
          analysisEntry,
          tradePlan
        );
        
        // Update the analysis entry with Aria assessment
        newEntry.technicalAssessment = {
          text: assessment,
          modelVersion: 'deepseek-reasoner',
          promptVersion: 'technical-analysis-v1',
          confidenceScore: 0.85,
          assessmentTimestamp: new Date()
        };
        
        await tradePlan.save();
        dlog('Aria technical assessment generated successfully for timeframe:', timeframe);
      } catch (assessmentError) {
        console.error('Error generating Aria technical assessment:', assessmentError);
        // Don't fail the request if assessment generation fails
        dlog('Failed to generate Aria assessment, continuing without it');
      }
    }, 100);
    
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error creating analysis entry:', error);
    res.status(500).json({ error: 'Failed to create analysis entry' });
  }
});

// Get all analysis entries for a trade plan
router.get('/:id/analysis-entries', authenticateToken, async (req, res) => {
  try {
    const tradePlan = await TradePlan.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!tradePlan) {
      return res.status(404).json({ error: 'Trade plan not found' });
    }
    
    res.json(tradePlan.analysisEntries || []);
  } catch (error) {
    console.error('Error fetching analysis entries:', error);
    res.status(500).json({ error: 'Failed to fetch analysis entries' });
  }
});

// Update analysis entry
router.put('/:id/analysis-entries/:entryId', authenticateToken, async (req, res) => {
  try {
    const { trend, choch, divergence, stochastics, timeCriteria, atrAnalysis, movingAverages, notes, screenshots } = req.body;
    
    // Find the trade plan
    const tradePlan = await TradePlan.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!tradePlan) {
      return res.status(404).json({ error: 'Trade plan not found' });
    }
    
    // Find the analysis entry
    const analysisEntry = tradePlan.analysisEntries.id(req.params.entryId);
    if (!analysisEntry) {
      return res.status(404).json({ error: 'Analysis entry not found' });
    }
    
    // Update the analysis entry
    analysisEntry.trend = trend;
    analysisEntry.choch = choch;
    analysisEntry.divergence = divergence;
    analysisEntry.stochastics = stochastics;
    analysisEntry.timeCriteria = timeCriteria;
    analysisEntry.atrAnalysis = atrAnalysis;
    analysisEntry.movingAverages = movingAverages;
    analysisEntry.notes = notes;
    analysisEntry.screenshots = screenshots || analysisEntry.screenshots;
    
    // Recalculate grades and directional bias
    const { grades, totalGrade, directionalBias } = calculateAnalysisGrades(analysisEntry);
    
    // Update calculated fields
    Object.assign(analysisEntry, grades, { totalGrade, directionalBias });
    analysisEntry.updatedAt = new Date();
    
    await tradePlan.save();
    
    res.json(analysisEntry);
  } catch (error) {
    console.error('Error updating analysis entry:', error);
    res.status(500).json({ error: 'Failed to update analysis entry' });
  }
});

// Delete analysis entry
router.delete('/:id/analysis-entries/:entryId', authenticateToken, async (req, res) => {
  try {
    const tradePlan = await TradePlan.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!tradePlan) {
      return res.status(404).json({ error: 'Trade plan not found' });
    }
    
    // Remove the analysis entry
    tradePlan.analysisEntries.pull({ _id: req.params.entryId });
    await tradePlan.save();
    
    res.json({ message: 'Analysis entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting analysis entry:', error);
    res.status(500).json({ error: 'Failed to delete analysis entry' });
  }
});

// Manually trigger Aria assessment for analysis entry
router.post('/:id/analysis-entries/:entryId/aria-assessment', authenticateToken, async (req, res) => {
  try {
    const tradePlan = await TradePlan.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!tradePlan) {
      return res.status(404).json({ error: 'Trade plan not found' });
    }
    
    // Find the analysis entry
    const analysisEntry = tradePlan.analysisEntries.id(req.params.entryId);
    if (!analysisEntry) {
      return res.status(404).json({ error: 'Analysis entry not found' });
    }
    
    // Generate Aria assessment based on the analysis entry
    const assessment = await aiService.generateTechnicalAssessment(analysisEntry);
    
    // Update the analysis entry with Aria assessment
    analysisEntry.technicalAssessment = {
      text: assessment,
      modelVersion: 'deepseek-reasoner',
      promptVersion: 'technical-analysis-v1',
      confidenceScore: 0.85, // Placeholder - could be calculated based on assessment quality
      assessmentTimestamp: new Date()
    };
    
    await tradePlan.save();
    
    res.json({
      assessment: analysisEntry.technicalAssessment,
      message: 'Aria assessment generated successfully'
    });
  } catch (error) {
    console.error('Error generating Aria assessment:', error);
    res.status(500).json({ error: 'Failed to generate Aria assessment' });
  }
});

export default router;
