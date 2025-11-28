import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const emotionalStateSchema = new mongoose.Schema({
  state: {
    type: String,
    required: true
  },
  bodySignals: [{
    signal: String,
    intensity: {
      type: Number,
      min: 1,
      max: 10
    }
  }],
  notes: String,
  aiAnalysis: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Analysis Entry Schema for Multi-timeframe Analysis
const analysisEntrySchema = new mongoose.Schema({
  timeframe: {
    type: String,
    enum: ['HTF', 'MTF', 'LTF'],
    required: true
  },
  
  // 7 Technical Element Selections (store selections only, calculate grades dynamically)
  trend: {
    type: String,
    enum: ['up_trending_above_ma', 'up_consolidation', 'down_trending_below_ma', 'down_consolidation', 'unclear']
  },
  choch: {
    type: String,
    enum: ['no_change', 'up_trend_broken', 'down_trend_broken', 'up_confirmed_not_verified', 'down_confirmed_not_verified', 'up_verified_not_confirmed', 'down_verified_not_confirmed', 'up_confirmed_verified', 'down_confirmed_verified']
  },
  divergence: {
    type: String,
    enum: ['none', 'five_waves_up_divergence', 'five_waves_down_divergence', 'three_waves_up_divergence', 'three_waves_down_divergence']
  },
  stochastics: {
    type: String,
    enum: ['oversold', 'overbought', 'moving_up', 'moving_down', 'directionless', 'divergence_overbought', 'divergence_oversold']
  },
  timeCriteria: {
    type: String,
    enum: ['uptrend_consolidation_met', 'downtrend_consolidation_met', 'uptrend_time_not_over', 'downtrend_time_not_over', 'consolidation_not_met', 'trend_time_over', 'not_valid']
  },
  atrAnalysis: {
    type: String,
    enum: ['up_candle_high', 'down_candle_high', 'up_candle_medium', 'down_candle_medium', 'low']
  },
  movingAverages: {
    type: String,
    enum: ['crossing_up', 'fanning_up', 'crossing_down', 'fanning_down', 'unclear']
  },
  
  // Discretionary Fields
  discretionaryOverallDirection: {
    type: String,
    enum: ['long', 'short', 'unclear']
  },
  notes: String,
  
  // Media - Support both MT5 files and TradingView links
  screenshots: [{
    url: String,
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['mt5_file', 'tradingview_link'],
      default: 'mt5_file'
    },
    note: String // Individual screenshot notes
  }],
  
  // AI Assessment with Versioning
  technicalAssessment: {
    text: String,
    modelVersion: String,
    promptVersion: String,
    confidenceScore: Number,
    assessmentTimestamp: {
      type: Date,
      default: Date.now
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on analysis entry save
analysisEntrySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const tradePlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Trade Setup
  asset: {
    type: String,
    required: true
  },
  direction: {
    type: String,
    enum: ['long', 'short'],
    required: true
  },
  timeframe: {
    type: String,
    enum: ['1m', '5m', '15m', '1h', '4h', '1d', '1w'],
    required: true
  },
  
  // Emotional Assessment
  emotionalState: emotionalStateSchema,
  
  // Chat Conversation
  conversation: {
    type: [chatMessageSchema],
    default: []
  },
  
  // Multi-timeframe Analysis Entries
  analysisEntries: {
    type: [analysisEntrySchema],
    default: []
  },
  
  // Workflow Status
  status: {
    type: String,
    enum: ['open', 'emotional_check', 'technical_analysis', 'planning', 'monitoring', 'entered', 'completed', 'passed_over', 'cancelled'],
    default: 'open'
  },
  
  // Decision
  decision: {
    type: String,
    enum: ['proceed', 'proceed_caution', 'take_break', 'reconsider', 'passed'],
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
tradePlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('TradePlan', tradePlanSchema);
