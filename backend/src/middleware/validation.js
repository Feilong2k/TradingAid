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

export {
  oauthCallbackSchema,
  tradePlanSchema,
  tradePlanUpdateSchema,
  emotionalStateUpdateSchema,
  decisionUpdateSchema
};
