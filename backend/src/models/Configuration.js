import mongoose from 'mongoose';

const configurationSchema = new mongoose.Schema({
  configType: {
    type: String,
    enum: ['assets', 'timeframes', 'emotions', 'body_signals'],
    required: true
  },
  configData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
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
configurationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create index for faster lookups
configurationSchema.index({ configType: 1, isActive: 1 });

export default mongoose.model('Configuration', configurationSchema);
