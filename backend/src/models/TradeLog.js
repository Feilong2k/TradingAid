import mongoose from 'mongoose';

const tradeLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // MT5 Trade Details
  mt5Ticket: {
    type: String,
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  direction: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  volume: {
    type: Number,
    required: true
  },
  entryPrice: {
    type: Number,
    required: true
  },
  exitPrice: {
    type: Number
  },
  profit: {
    type: Number,
    required: true
  },
  commission: {
    type: Number,
    default: 0
  },
  swap: {
    type: Number,
    default: 0
  },
  openTime: {
    type: Date,
    required: true
  },
  closeTime: {
    type: Date
  },
  // Account Details
  accountBalance: {
    type: Number,
    required: true
  },
  accountEquity: {
    type: Number,
    required: true
  },
  accountMargin: {
    type: Number
  },
  // Screenshot Information
  screenshotUrl: {
    type: String
  },
  screenshotFileId: {
    type: String
  },
  // Emotional Context (linked to TradePlan if available)
  emotionalContext: {
    preTradeEmotion: String,
    postTradeEmotion: String,
    linkedTradePlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TradePlan'
    }
  },
  // Trade Status
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'closed'
  },
  // Import Metadata
  importedAt: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['mt5_ea', 'manual_import'],
    default: 'mt5_ea'
  }
}, {
  timestamps: true
});

// Index for efficient queries
tradeLogSchema.index({ userId: 1, openTime: -1 });
tradeLogSchema.index({ userId: 1, symbol: 1 });
tradeLogSchema.index({ userId: 1, status: 1 });

// Virtual for trade duration in minutes
tradeLogSchema.virtual('duration').get(function() {
  if (this.closeTime && this.openTime) {
    return Math.round((this.closeTime - this.openTime) / (1000 * 60));
  }
  return null;
});

// Virtual for risk/reward ratio
tradeLogSchema.virtual('riskRewardRatio').get(function() {
  if (this.profit && this.volume && this.entryPrice) {
    const risk = this.volume * this.entryPrice * 0.01; // Simplified risk calculation
    return Math.abs(this.profit / risk);
  }
  return null;
});

// Ensure virtual fields are serialized
tradeLogSchema.set('toJSON', { virtuals: true });

const TradeLog = mongoose.model('TradeLog', tradeLogSchema);
export default TradeLog;
