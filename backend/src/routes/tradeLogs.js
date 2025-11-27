import express from 'express';
import TradeLog from '../models/TradeLog.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateTradeLog, validateTradeLogImport } from '../middleware/validation.js';
import googleDriveService from '../services/googleDriveService.js';
import ApiKey from '../models/ApiKey.js';

const router = express.Router();

// Get all trade logs for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      symbol, 
      status, 
      startDate, 
      endDate,
      sortBy = 'openTime',
      sortOrder = 'desc'
    } = req.query;

    const query = { userId: req.user._id };
    
    // Apply filters
    if (symbol) query.symbol = symbol;
    if (status) query.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      query.openTime = {};
      if (startDate) query.openTime.$gte = new Date(startDate);
      if (endDate) query.openTime.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: 'emotionalContext.linkedTradePlanId'
    };

    const tradeLogs = await TradeLog.find(query)
      .sort(options.sort)
      .limit(options.limit * options.page)
      .skip((options.page - 1) * options.limit)
      .populate('emotionalContext.linkedTradePlanId');

    const total = await TradeLog.countDocuments(query);

    res.json({
      tradeLogs,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching trade logs:', error);
    res.status(500).json({ error: 'Failed to fetch trade logs' });
  }
});

// Get trade logs context for AI analysis (today's and yesterday's trades)
router.get('/context', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(startOfYesterday);
    endOfYesterday.setDate(endOfYesterday.getDate() + 1);

    const [todayTrades, yesterdayTrades] = await Promise.all([
      TradeLog.find({
        userId: req.user._id,
        openTime: { $gte: startOfToday }
      }).sort({ openTime: -1 }),
      
      TradeLog.find({
        userId: req.user._id,
        openTime: { $gte: startOfYesterday, $lt: endOfYesterday }
      }).sort({ openTime: -1 })
    ]);

    // Calculate performance metrics
    const calculateMetrics = (trades) => {
      const closedTrades = trades.filter(trade => trade.status === 'closed');
      const winningTrades = closedTrades.filter(trade => trade.profit > 0);
      const losingTrades = closedTrades.filter(trade => trade.profit < 0);
      
      const totalProfit = closedTrades.reduce((sum, trade) => sum + trade.profit, 0);
      const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
      const avgProfit = closedTrades.length > 0 ? totalProfit / closedTrades.length : 0;
      
      return {
        totalTrades: trades.length,
        closedTrades: closedTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate: Math.round(winRate * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        avgProfit: Math.round(avgProfit * 100) / 100,
        trades: trades.slice(0, 10) // Return recent trades for context
      };
    };

    res.json({
      today: calculateMetrics(todayTrades),
      yesterday: calculateMetrics(yesterdayTrades),
      currentBalance: todayTrades[0]?.accountBalance || 0
    });
  } catch (error) {
    console.error('Error fetching trade context:', error);
    res.status(500).json({ error: 'Failed to fetch trade context' });
  }
});

// Create a new trade log (for MT5 EA)
router.post('/', validateTradeLog, async (req, res) => {
  try {
    const {
      mt5Ticket,
      symbol,
      direction,
      volume,
      entryPrice,
      exitPrice,
      profit,
      commission,
      swap,
      openTime,
      closeTime,
      accountBalance,
      accountEquity,
      accountMargin,
      screenshot,
      apiKey
    } = req.body;

    // Resolve user via: JWT, ApiKey mapping, or (dev-only) env fallback
    let userId = req.user?._id || null;

    if (!userId && apiKey) {
      try {
        const keyDoc = await ApiKey.findOne({ apiKey, isActive: true }).select('userId');
        if (keyDoc) {
          userId = keyDoc.userId;
        }
      } catch (e) {
        console.error('Error looking up API key:', e);
      }
    }

    // Dev fallback: allow single env key to map to DEFAULT_USER_ID (disabled in production)
    if (
      !userId &&
      process.env.NODE_ENV !== 'production' &&
      process.env.MT5_API_KEY &&
      process.env.DEFAULT_USER_ID &&
      apiKey === process.env.MT5_API_KEY
    ) {
      userId = process.env.DEFAULT_USER_ID;
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: invalid or missing API key' });
    }

    let screenshotUrl = null;
    let screenshotFileId = null;

    // Handle screenshot upload if provided
    if (screenshot && googleDriveService.isAvailable()) {
      try {
        const screenshotResult = await googleDriveService.uploadBase64Image(
          screenshot,
          `${symbol}_${mt5Ticket}`
        );
        screenshotUrl = screenshotResult.webViewLink;
        screenshotFileId = screenshotResult.fileId;
      } catch (screenshotError) {
        console.error('Failed to upload screenshot:', screenshotError);
        // Continue without screenshot if upload fails
      }
    }

    const tradeLog = new TradeLog({
      userId,
      mt5Ticket,
      symbol,
      direction,
      volume,
      entryPrice,
      exitPrice,
      profit,
      commission,
      swap,
      openTime: new Date(openTime),
      closeTime: closeTime ? new Date(closeTime) : null,
      accountBalance,
      accountEquity,
      accountMargin,
      screenshotUrl,
      screenshotFileId,
      status: closeTime ? 'closed' : 'open'
    });

    await tradeLog.save();

    console.log(`Trade log created for ticket ${mt5Ticket}`);
    res.status(201).json({
      message: 'Trade log created successfully',
      tradeLog: {
        id: tradeLog._id,
        mt5Ticket: tradeLog.mt5Ticket,
        screenshotUrl: tradeLog.screenshotUrl
      }
    });
  } catch (error) {
    console.error('Error creating trade log:', error);
    res.status(500).json({ error: 'Failed to create trade log' });
  }
});

// Upload screenshot for existing trade log
router.post('/:id/screenshot', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { screenshot } = req.body;

    const tradeLog = await TradeLog.findOne({ _id: id, userId: req.user._id });
    if (!tradeLog) {
      return res.status(404).json({ error: 'Trade log not found' });
    }

    if (!screenshot) {
      return res.status(400).json({ error: 'Screenshot data is required' });
    }

    if (!googleDriveService.isAvailable()) {
      return res.status(503).json({ error: 'Screenshot service unavailable' });
    }

    const screenshotResult = await googleDriveService.uploadBase64Image(
      screenshot,
      `${tradeLog.symbol}_${tradeLog.mt5Ticket}`
    );

    tradeLog.screenshotUrl = screenshotResult.webViewLink;
    tradeLog.screenshotFileId = screenshotResult.fileId;
    await tradeLog.save();

    res.json({
      message: 'Screenshot uploaded successfully',
      screenshotUrl: tradeLog.screenshotUrl
    });
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    res.status(500).json({ error: 'Failed to upload screenshot' });
  }
});

// Import historical trade data
router.post('/import', authenticateToken, validateTradeLogImport, async (req, res) => {
  try {
    const { trades } = req.body;
    const importedTrades = [];
    const errors = [];

    for (const tradeData of trades) {
      try {
        // Check if trade already exists
        const existingTrade = await TradeLog.findOne({
          userId: req.user._id,
          mt5Ticket: tradeData.mt5Ticket
        });

        if (existingTrade) {
          errors.push(`Trade ${tradeData.mt5Ticket} already exists`);
          continue;
        }

        const tradeLog = new TradeLog({
          userId: req.user._id,
          ...tradeData,
          source: 'manual_import',
          openTime: new Date(tradeData.openTime),
          closeTime: tradeData.closeTime ? new Date(tradeData.closeTime) : null
        });

        await tradeLog.save();
        importedTrades.push(tradeLog._id);
      } catch (tradeError) {
        errors.push(`Failed to import trade ${tradeData.mt5Ticket}: ${tradeError.message}`);
      }
    }

    res.json({
      message: `Imported ${importedTrades.length} trades successfully`,
      importedCount: importedTrades.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importing trade logs:', error);
    res.status(500).json({ error: 'Failed to import trade logs' });
  }
});

// Get trade log by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const tradeLog = await TradeLog.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('emotionalContext.linkedTradePlanId');

    if (!tradeLog) {
      return res.status(404).json({ error: 'Trade log not found' });
    }

    res.json(tradeLog);
  } catch (error) {
    console.error('Error fetching trade log:', error);
    res.status(500).json({ error: 'Failed to fetch trade log' });
  }
});

// Update trade log (for linking with trade plans, etc.)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { emotionalContext } = req.body;
    const allowedUpdates = ['emotionalContext'];

    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const tradeLog = await TradeLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    ).populate('emotionalContext.linkedTradePlanId');

    if (!tradeLog) {
      return res.status(404).json({ error: 'Trade log not found' });
    }

    res.json(tradeLog);
  } catch (error) {
    console.error('Error updating trade log:', error);
    res.status(500).json({ error: 'Failed to update trade log' });
  }
});

// Delete trade log
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const tradeLog = await TradeLog.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!tradeLog) {
      return res.status(404).json({ error: 'Trade log not found' });
    }

    // Delete screenshot from Google Drive if exists
    if (tradeLog.screenshotFileId && googleDriveService.isAvailable()) {
      try {
        await googleDriveService.deleteFile(tradeLog.screenshotFileId);
      } catch (screenshotError) {
        console.error('Failed to delete screenshot:', screenshotError);
        // Continue with trade log deletion even if screenshot deletion fails
      }
    }

    await TradeLog.deleteOne({ _id: req.params.id });
    res.json({ message: 'Trade log deleted successfully' });
  } catch (error) {
    console.error('Error deleting trade log:', error);
    res.status(500).json({ error: 'Failed to delete trade log' });
  }
});

export default router;
