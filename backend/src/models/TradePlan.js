import mongoose from 'mongoose';

const emotionalStateSchema = new mongoose.Schema({
  state: {
    type: String,
    enum: ['calm', 'confident', 'anxious', 'fearful', 'greedy', 'frustrated', 'impatient', 'disciplined'],
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
  
  // Workflow Status
  status: {
    type: String,
    enum: ['emotional_check', 'technical_analysis', 'planning', 'monitoring', 'entered', 'completed', 'passed_over', 'cancelled'],
    default: 'emotional_check'
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
