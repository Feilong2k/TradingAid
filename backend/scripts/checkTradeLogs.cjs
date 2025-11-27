// Quick verification script to check imported Trade Logs in MongoDB
// Usage: node backend/scripts/checkTradeLogs.cjs

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

(async () => {
  try {
    // Load backend environment variables
    dotenv.config({ path: path.resolve(__dirname, '../.env') });

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradingapp';
    console.log('[CheckTradeLogs] Connecting to MongoDB:', uri.replace(/\/\/.*@/, '//<redacted>@'));

    // Define a minimal model matching the existing TradeLog collection
    const tradeLogSchema = new mongoose.Schema({}, { strict: false, collection: 'tradelogs', timestamps: true });
    const TradeLog = mongoose.models.TradeLog || mongoose.model('TradeLog', tradeLogSchema);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
    });

    // Basic counts
    const total = await TradeLog.countDocuments({});

    // Today range
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const todayCount = await TradeLog.countDocuments({ createdAt: { $gte: startOfToday } });

    // Latest few entries
    const latest = await TradeLog.find({}).sort({ createdAt: -1 }).limit(5).lean();

    console.log('--- Trade Logs Summary ---');
    console.log('Total trade logs:', total);
    console.log('Today new logs  :', todayCount);
    console.log('Latest 5 entries (mt5Ticket, symbol, direction, openTime, profit):');
    for (const t of latest) {
      console.log(
        ` - ${t.mt5Ticket || '<n/a>'} | ${t.symbol || '<n/a>'} | ${t.direction || '<n/a>'} | ${t.openTime || t.createdAt || '<n/a>'} | ${t.profit ?? '<n/a>'}`
      );
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[CheckTradeLogs] Error:', err?.message || err);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
})();
