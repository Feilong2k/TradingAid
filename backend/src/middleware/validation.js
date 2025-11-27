import Joi from 'joi';

// Validation schema for OAuth callback
const oauthCallbackSchema = Joi.object({
  code: Joi.string().required().min(10).max(500)
    .pattern(/^[a-zA-Z0-9\-_\.\/+=]+$/)
    .messages({
      'string.empty': 'Authorization code is required',
      'string.min': 'Invalid authorization code format',
      'string.max': 'Invalid authorization code format',
      'string.pattern.base': 'Invalid authorization code format'
    })
});

// Validation schema for trade plan creation
const tradePlanSchema = Joi.object({
  asset: Joi.string().required().min(1).max(50)
    .pattern(/^[a-zA-Z0-9\-\/\s]+$/)
    .messages({
      'string.empty': 'Asset is required',
      'string.max': 'Asset name too long',
      'string.pattern.base': 'Invalid asset format'
    }),
  direction: Joi.string().valid('long', 'short').required()
    .messages({
      'any.only': 'Direction must be either long or short'
    }),
  timeframe: Joi.string().valid('1m', '5m', '15m', '1h', '4h', '1d', '1w').required()
    .messages({
      'any.only': 'Invalid timeframe'
    }),
  emotionalState: Joi.object({
    state: Joi.string().valid('calm', 'confident', 'anxious', 'fearful', 'greedy', 'frustrated', 'impatient', 'disciplined').optional(),
    bodySignals: Joi.array().items(
      Joi.object({
        signal: Joi.string().max(100).allow('', null),
        intensity: Joi.number().min(1).max(10).optional()
      })
    ).max(10).optional(),
    notes: Joi.string().max(500).allow('', null),
    aiAnalysis: Joi.string().max(1000).allow('', null)
  }).optional().allow(null),
  status: Joi.string().valid('open', 'emotional_check', 'technical_analysis', 'planning', 'monitoring', 'entered', 'completed', 'passed_over', 'cancelled').optional(),
  decision: Joi.string().valid('proceed', 'proceed_caution', 'take_break', 'reconsider', 'passed').optional()
});

// Validation schema for trade plan update
const tradePlanUpdateSchema = Joi.object({
  asset: Joi.string().min(1).max(50)
    .pattern(/^[a-zA-Z0-9\-\/\s]+$/)
    .optional(),
  direction: Joi.string().valid('long', 'short').optional(),
  timeframe: Joi.string().valid('1m', '5m', '15m', '1h', '4h', '1d', '1w').optional(),
  emotionalState: Joi.object({
    state: Joi.string().required(),
    bodySignals: Joi.array().items(
      Joi.object({
        signal: Joi.string().max(100),
        intensity: Joi.number().min(1).max(10)
      })
    ).max(10),
    notes: Joi.string().max(500).allow('', null),
    aiAnalysis: Joi.string().max(1000).allow('', null)
  }).optional(),
  status: Joi.string().valid('emotional_check', 'technical_analysis', 'planning', 'monitoring', 'entered', 'completed', 'passed_over', 'cancelled').optional(),
  decision: Joi.string().valid('proceed', 'proceed_caution', 'take_break', 'reconsider', 'passed').optional()
}).min(1); // At least one field must be provided

// Validation schema for emotional state update
const emotionalStateUpdateSchema = Joi.object({
  emotionalState: Joi.object({
    state: Joi.string().required(),
    bodySignals: Joi.array().items(
      Joi.object({
        signal: Joi.string().max(100),
        intensity: Joi.number().min(1).max(10)
      })
    ).max(10),
    notes: Joi.string().max(500).allow('', null)
  }).required()
});

// Validation schema for decision update
const decisionUpdateSchema = Joi.object({
  decision: Joi.string().valid('proceed', 'proceed_caution', 'take_break', 'reconsider', 'passed').required()
});

// Validation schema for trade log creation (from MT5 EA)
const tradeLogSchema = Joi.object({
  mt5Ticket: Joi.string().required().min(1).max(50)
    .messages({
      'string.empty': 'MT5 ticket is required',
      'string.max': 'MT5 ticket too long'
    }),
  symbol: Joi.string().required().min(1).max(20)
    .messages({
      'string.empty': 'Symbol is required',
      'string.max': 'Symbol name too long'
    }),
  direction: Joi.string().valid('BUY', 'SELL').required()
    .messages({
      'any.only': 'Direction must be either BUY or SELL'
    }),
  volume: Joi.number().required().min(0.01).max(1000)
    .messages({
      'number.min': 'Volume must be at least 0.01',
      'number.max': 'Volume too large'
    }),
  entryPrice: Joi.number().required().min(0.00001).max(1000000)
    .messages({
      'number.min': 'Invalid entry price',
      'number.max': 'Invalid entry price'
    }),
  exitPrice: Joi.number().min(0.00001).max(1000000).optional()
    .messages({
      'number.min': 'Invalid exit price',
      'number.max': 'Invalid exit price'
    }),
  profit: Joi.number().required().min(-1000000).max(1000000)
    .messages({
      'number.min': 'Invalid profit value',
      'number.max': 'Invalid profit value'
    }),
  commission: Joi.number().min(0).max(10000).default(0)
    .messages({
      'number.min': 'Invalid commission value',
      'number.max': 'Invalid commission value'
    }),
  swap: Joi.number().min(-10000).max(10000).default(0)
    .messages({
      'number.min': 'Invalid swap value',
      'number.max': 'Invalid swap value'
    }),
  openTime: Joi.date().required()
    .messages({
      'date.base': 'Invalid open time'
    }),
  closeTime: Joi.date().optional()
    .messages({
      'date.base': 'Invalid close time'
    }),
  accountBalance: Joi.number().required().min(0).max(100000000)
    .messages({
      'number.min': 'Invalid account balance',
      'number.max': 'Invalid account balance'
    }),
  accountEquity: Joi.number().required().min(0).max(100000000)
    .messages({
      'number.min': 'Invalid account equity',
      'number.max': 'Invalid account equity'
    }),
  accountMargin: Joi.number().min(0).max(100000000).optional()
    .messages({
      'number.min': 'Invalid account margin',
      'number.max': 'Invalid account margin'
    }),
  screenshot: Joi.string().max(10000000).optional() // Base64 string can be large
    .messages({
      'string.max': 'Screenshot data too large'
    }),
  apiKey: Joi.string().optional() // For MT5 EA authentication
});

// Validation schema for trade log import (multiple trades)
const tradeLogImportSchema = Joi.object({
  trades: Joi.array().items(
    Joi.object({
      mt5Ticket: Joi.string().required().min(1).max(50),
      symbol: Joi.string().required().min(1).max(20),
      direction: Joi.string().valid('BUY', 'SELL').required(),
      volume: Joi.number().required().min(0.01).max(1000),
      entryPrice: Joi.number().required().min(0.00001).max(1000000),
      exitPrice: Joi.number().min(0.00001).max(1000000).optional(),
      profit: Joi.number().required().min(-1000000).max(1000000),
      commission: Joi.number().min(0).max(10000).default(0),
      swap: Joi.number().min(-10000).max(10000).default(0),
      openTime: Joi.date().required(),
      closeTime: Joi.date().optional(),
      accountBalance: Joi.number().required().min(0).max(100000000),
      accountEquity: Joi.number().required().min(0).max(100000000),
      accountMargin: Joi.number().min(0).max(100000000).optional()
    })
  ).min(1).max(1000) // Limit to 1000 trades per import
    .messages({
      'array.min': 'At least one trade is required',
      'array.max': 'Too many trades in single import'
    })
});

// Validation middleware
export const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessages
      });
    }

    // Replace the request data with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Validation for query parameters
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Query validation failed',
        details: errorMessages
      });
    }

    req.query = value;
    next();
  };
};

// Trade log validation middleware
export const validateTradeLog = validateRequest(tradeLogSchema);
export const validateTradeLogImport = validateRequest(tradeLogImportSchema);

export {
  oauthCallbackSchema,
  tradePlanSchema,
  tradePlanUpdateSchema,
  emotionalStateUpdateSchema,
  decisionUpdateSchema,
  tradeLogSchema,
  tradeLogImportSchema
};
