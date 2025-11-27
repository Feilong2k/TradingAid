# Trading Plan Modal Development Plan

## Overview

This document outlines the detailed development plan for enhancing the trading plan modal with AI-powered emotional state monitoring, context-aware behavior, and comprehensive trading workflow management.

## Current State Analysis

### Existing Foundation
- ✅ Basic 2-step modal (trade setup + emotional check)
- ✅ Emotion selection with positive/negative categorization  
- ✅ Body signals for negative emotions
- ✅ AI service integration with DeepSeek API
- ✅ Trade plan data model with emotional state tracking
- ✅ Well-defined AI personality configuration
- ✅ **Aria AI Persona** - Female trading coach with warm, supportive communication style
- ✅ **Context-aware emotional check-in** - AI provides trading context before emotional assessment
- ✅ **Fixed 400 errors** - Timeframe normalization and validation improvements
- ✅ **Enhanced AI responses** - Shorter, more focused analysis (2-3 paragraphs max)
- ✅ **Enhanced Asset Autocomplete** - Immediate dropdown on focus with arrow key navigation
- ✅ **Improved Modal Behavior** - Only closes on X button click, not overlay click
- ✅ **Instant Emotional Check** - Appears immediately without waiting for AI analysis
- ✅ **Enhanced Modal Height** - Increased from 700px to 800px for better chat visibility
- ✅ **Explicit Emotional Submission** - Submit button instead of auto-sending emotional data

### Missing Features to Implement
1. **Context-aware AI behavior** (first trade, winning/losing streaks)
2. **Image/screenshot analysis** for emotional state detection
3. **Timer functionality** for 5-minute breaks
4. **Historical trade analysis** for AI context
5. **Enhanced emotional state tracking** with dynamic questioning
6. **Trade status workflow management** (open, passed, etc.)

## Phase 0: Configuration Database Setup

### New Configuration Data Models

#### Configuration Model
```javascript
// backend/src/models/Configuration.js
const configurationSchema = new mongoose.Schema({
  configType: {
    type: String,
    enum: ['assets', 'timeframes', 'emotions', 'body_signals'],
    required: true
  },
  configData: mongoose.Schema.Types.Mixed, // Flexible data structure
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
```

#### Initial Configuration Data
```javascript
// Initial seed data
const initialConfigurations = [
  {
    configType: 'assets',
    configData: ['BTC', 'NQ', 'GBPUSD', 'USDJPY', 'GOLD', 'JP225']
  },
  {
    configType: 'timeframes',
    configData: ['M15', 'M5', 'M1', 'H1', 'M3', 'H4']
  },
  {
    configType: 'emotions',
    configData: [
      { value: 'calm', label: 'Calm', type: 'positive' },
      { value: 'focused', label: 'Focused', type: 'positive' },
      { value: 'confident', label: 'Confident', type: 'positive' },
      { value: 'anxious', label: 'Anxious', type: 'negative' },
      { value: 'rushed', label: 'Rushed', type: 'negative' },
      { value: 'fearful', label: 'Fearful', type: 'negative' },
      { value: 'hopeful', label: 'Hopeful', type: 'negative' },
      { value: 'excited', label: 'Excited', type: 'negative' },
      { value: 'greedy', label: 'Greedy', type: 'negative' },
      { value: 'irritated', label: 'Irritated', type: 'negative' },
      { value: 'frustrated', label: 'Frustrated', type: 'negative' },
      { value: 'angry', label: 'Angry', type: 'negative' },
      { value: 'disappointed', label: 'Disappointed', type: 'negative' },
      { value: 'regretful', label: 'Regretful', type: 'negative' },
      { value: 'ashamed', label: 'Ashamed', type: 'negative' }
    ]
  },
  {
    configType: 'body_signals',
    configData: [
      { category: 'stress', signal: 'Tight shoulders, neck jaw' },
      { category: 'stress', signal: 'Clenched fists or teeth' },
      { category: 'stress', signal: 'Short, shallow breathing' },
      { category: 'stress', signal: 'Rapid heart rate' },
      { category: 'fomo', signal: 'Restless legs' },
      { category: 'fomo', signal: 'Urge to click button impulsively' },
      { category: 'fomo', signal: 'Sense of I have to do something now' },
      { category: 'anger', signal: 'Tight stomach, or chest' },
      { category: 'anger', signal: 'Heavy breathing or sighing' },
      { category: 'anger', signal: 'Sudden movements or harsh mouse clicks' },
      { category: 'fear', signal: 'Cold hands' },
      { category: 'fear', signal: 'Sinking feeling in stomach' },
      { category: 'fear', signal: 'Hesitating on entries or exits' },
      { category: 'fear', signal: 'Holding breath' },
      { category: 'greed', signal: 'Feeling invincible or overly confident' },
      { category: 'greed', signal: 'Fast breathing, energy spike' },
      { category: 'greed', signal: 'Grinning or leaning forward eagerly' },
      { category: 'greed', signal: 'Ignoring plan or over leveraging' },
      { category: 'greed', signal: 'Changing Profit target' }
    ]
  }
];
```

#### New API Endpoints
- `GET /api/config/:type` - Get configuration by type
- `PUT /api/config/:type` - Update configuration (admin only)
- `GET /api/config` - Get all configurations

### Frontend Changes
- Update modal to fetch configurations from API instead of hardcoded values
- Add admin interface for configuration management

## Phase 1: Enhanced AI Context & Historical Analysis

### Backend Changes

#### New Data Model Extensions
```javascript
// Add to TradePlan model
tradingContext: {
  isFirstTradeOfDay: Boolean,
  currentStreak: {
    type: String,
    enum: ['winning', 'losing', 'neutral'],
    default: 'neutral'
  },
  streakCount: Number,
  recentPerformance: {
    winRate: Number,
    avgReturn: Number,
    totalTrades: Number
  }
}
```

#### New API Endpoints
- `GET /api/trade-plans/trading-context` - Get user's current trading context
- `GET /api/trade-plans/performance-stats` - Get performance analytics
- `POST /api/trade-plans/:id/analyze-context` - Get context-aware AI analysis

#### Enhanced AI Service
```javascript
// New method in AIService
async analyzeTradingContext(userId, tradePlan, historicalData) {
  const prompt = `
TRADING CONTEXT ANALYSIS:

User is about to trade ${tradePlan.asset} ${tradePlan.direction} on ${tradePlan.timeframe}

TRADING CONTEXT:
- First trade of day: ${historicalData.isFirstTradeOfDay}
- Current streak: ${historicalData.currentStreak} (${historicalData.streakCount} trades)
- Recent performance: ${historicalData.recentPerformance.winRate}% win rate

Please provide context-aware emotional questions and analysis based on this trading situation. 
Focus on potential emotional triggers and provide appropriate guidance.
`;

  return await this.callDeepseek(userId, prompt, 'deepseek-reasoner');
}
```

### Frontend Changes
- Extend modal to fetch and display trading context
- Update emotional check step with context-aware questions
- Add performance stats display component

## Phase 2: Image Analysis Integration

### Backend Changes

#### New Data Model Extensions
```javascript
// Add to emotionalStateSchema
imageAnalysis: {
  facialExpression: String,
  confidence: Number,
  emotions: [{
    emotion: String,
    score: Number
  }],
  screenshotUrl: String,
  analysisTimestamp: Date
}
```

#### New API Endpoints
- `POST /api/trade-plans/:id/analyze-image` - Analyze uploaded screenshot
- Integration with image analysis service (Clarifai/Google Vision)

#### Enhanced AI Service
```javascript
// New method in AIService
async analyzeEmotionalStateWithImage(userId, emotionalData, imageAnalysis) {
  const prompt = `
COMBINED EMOTIONAL ANALYSIS:

USER REPORTED EMOTIONS:
${JSON.stringify(emotionalData, null, 2)}

IMAGE ANALYSIS RESULTS:
${JSON.stringify(imageAnalysis, null, 2)}

Please analyze the combined emotional state, noting any discrepancies between self-reported emotions and image analysis. Provide guidance accordingly.
`;

  return await this.callDeepseek(userId, prompt, 'deepseek-reasoner');
}
```

### Frontend Changes
- Add image upload component to emotional check step
- Display image analysis results alongside self-reported emotions
- Implement drag-and-drop for screenshot uploads

## Phase 3: Timer & Workflow Management

### Backend Changes

#### New Data Model Extensions
```javascript
// Add to TradePlan model
breakTimer: {
  startTime: Date,
  duration: Number, // in minutes
  isActive: Boolean
},
workflowState: {
  currentStep: String,
  completedSteps: [String],
  nextAction: String
}
```

#### New API Endpoints
- `POST /api/trade-plans/:id/start-break` - Start 5-minute break timer
- `POST /api/trade-plans/:id/end-break` - End break and resume
- `GET /api/trade-plans/:id/timer-status` - Get current timer status

### Frontend Changes

#### New Components
- `BreakTimer.vue` - 5-minute countdown timer
- `WorkflowProgress.vue` - Visual workflow tracker
- `TradeStatusManager.vue` - Status transition handler

#### Modal Enhancements
- Add timer display when break is active
- Implement pause/resume functionality
- Add workflow state persistence

## Phase 4: Enhanced Emotional Intelligence

### Backend Changes

#### Enhanced AI Service
```javascript
// New dynamic questioning system
async generateContextualQuestions(userId, context, emotionalState) {
  const prompt = `
DYNAMIC EMOTIONAL QUESTIONING:

TRADING CONTEXT: ${JSON.stringify(context, null, 2)}
CURRENT EMOTIONAL STATE: ${emotionalState.state}

Based on this context and emotional state, generate 2-3 probing questions to encourage self-reflection and emotional awareness. Focus on potential blind spots and emotional triggers.
`;

  return await this.callDeepseek(userId, prompt, 'deepseek-reasoner');
}
```

### Frontend Changes
- Implement dynamic question display based on AI analysis
- Add follow-up emotional assessment steps
- Create emotional pattern visualization

## Phase 5: Enhanced AI Personality with Caring Friend Tone

### Updated AI Personality Configuration

#### Enhanced Emotional Response Templates (Caring Friend Approach)
```javascript
// Positive emotion responses with caring friend tone
const positiveResponses = {
  calm: "I'm glad you're feeling calm and focused. This centered state is perfect for making clear trading decisions. Ready to proceed?",
  focused: "Excellent focus! This mindful approach will serve you well. Let's move forward when you're ready.",
  confident: "It's great to see your confidence. Remember, I'm here to help you stay grounded in your process. Shall we continue?"
};

// Negative emotion responses with caring friend tone
const negativeResponses = {
  anxious: "I notice you're feeling anxious. That's completely normal. Would you like to take a moment to breathe or maybe take a short break to clear your head?",
  fearful: "Fear can be protective, but it can also hold us back. How about we review your risk management together? Or would you prefer a quick break?",
  greedy: "I see that greedy feeling coming up. Let's pause for a moment - remember how we've talked about discipline over quick profits. Would you like to revisit your trading plan?",
  rushed: "Feeling rushed can lead to impulsive decisions. Let's slow down for a moment. What's the hurry?",
  frustrated: "Frustration is tough. Let's take a step back and breathe. What's really bothering you about this trade?",
  angry: "Anger can cloud our judgment. How about we take a short break to cool down before making any decisions?"
};

// Context-aware responses
const contextResponses = {
  afterLoss: "How are you feeling after that trade? It's okay to feel disappointed. Would you like to take a break to recover before we look at the next opportunity?",
  afterWin: "You've been doing really well lately! How are you feeling about your recent success? Let's make sure we stay grounded.",
  firstTrade: "How are you feeling starting your trading day? Let's set the right tone together."
};
```

#### Progressive Emotional Assessment Flow
```javascript
// Progressive questioning system
async conductProgressiveAssessment(userId, initialEmotion, context) {
  let followUpQuestions = [];
  
  if (initialEmotion.type === 'positive') {
    followUpQuestions = [
      "I'm curious, what part of your analysis is giving you this confidence?",
      "Are you following all your trading rules with this setup?",
      "How does this opportunity compare to your best historical trades?"
    ];
  } else {
    followUpQuestions = [
      "I'm curious, what part of the current market is making you feel this way?",
      "Have you felt this way in past trades? How did that work out for you?",
      "What would help you feel more in control right now?"
    ];
  }
  
  // Add context-specific questions
  if (context.isFirstTradeOfDay) {
    followUpQuestions.push("How did you prepare for today's trading session?");
  } else if (context.currentStreak === 'losing' && context.streakCount >= 3) {
    followUpQuestions.push("What have you learned from reviewing your recent trades?");
  }
  
  return followUpQuestions;
}
```

### Enhanced Communication Style
Update the AI personality to include:
- "Warm, caring friend who genuinely wants the best for you"
- "Supportive partner in your trading journey"
- "Non-judgmental emotional support during tough trading moments"

## Phase 6: MT5 Integration & Historical Analysis

### MT5 Script Development

#### MQL5 Trade Export Script
```mql5
//+------------------------------------------------------------------+
//| Trade Export Script                                              |
//+------------------------------------------------------------------+
void OnTick() {
  // Export trades on trade events
  if(IsNewTrade()) {
    ExportTradesToCSV();
  }
}

void ExportTradesToCSV() {
  string filename = "MT5_Trades_" + TimeToString(TimeCurrent(), TIME_DATE) + ".csv";
  int file_handle = FileOpen(filename, FILE_WRITE|FILE_CSV|FILE_COMMON);
  
  if(file_handle != INVALID_HANDLE) {
    // Write header
    FileWrite(file_handle, "Ticket,Symbol,Direction,EntryPrice,ExitPrice,Volume,Profit,Commission,Swap,OpenTime,CloseTime");
    
    // Write trade history
    for(int i = OrdersHistoryTotal()-1; i >= 0; i--) {
      if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) {
        string direction = OrderType() == OP_BUY ? "BUY" : "SELL";
        FileWrite(file_handle, 
          IntegerToString(OrderTicket()),
          OrderSymbol(),
          direction,
          DoubleToString(OrderOpenPrice(), 5),
          DoubleToString(OrderClosePrice(), 5),
          DoubleToString(OrderLots(), 2),
          DoubleToString(OrderProfit(), 2),
          DoubleToString(OrderCommission(), 2),
          DoubleToString(OrderSwap(), 2),
          TimeToString(OrderOpenTime(), TIME_DATE|TIME_MINUTES),
          TimeToString(OrderCloseTime(), TIME_DATE|TIME_MINUTES)
        );
      }
    }
    FileClose(file_handle);
    
    // Upload to Google Drive (using system command or external tool)
    UploadToGoogleDrive(filename);
  }
}
```

### Google Drive Integration

#### Backend Google Drive Service
```javascript
// backend/src/services/googleDriveService.js
class GoogleDriveService {
  async monitorTradeFiles() {
    // Monitor Google Drive folder for new trade files
    // Download and process new files
    // Import trades into database
  }
  
  async importTradeFile(fileId) {
    // Download file from Google Drive
    // Parse CSV/JSON data
    // Validate and import trades
  }
}
```

#### New TradeLog Data Model
```javascript
// backend/src/models/TradeLog.js
const tradeLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mt5Ticket: String,
  symbol: String,
  direction: { type: String, enum: ['BUY', 'SELL'] },
  entryPrice: Number,
  exitPrice: Number,
  volume: Number,
  profit: Number,
  commission: Number,
  swap: Number,
  openTime: Date,
  closeTime: Date,
  // Link to emotional context if available
  emotionalContext: {
    preTradeEmotion: String,
    postTradeEmotion: String,
    bodySignals: [String],
    aiAnalysis: String
  },
  // Performance metrics
  riskRewardRatio: Number,
  duration: Number, // in minutes
  // Import metadata
  importedAt: { type: Date, default: Date.now },
  sourceFile: String
});
```

#### Enhanced AI Analysis with Historical Data
```javascript
// Enhanced AI service method
async analyzeWithHistoricalContext(userId, currentTradePlan, tradeHistory) {
  const prompt = `
COMPREHENSIVE TRADING ANALYSIS:

CURRENT TRADE PLAN:
${JSON.stringify(currentTradePlan, null, 2)}

TRADING HISTORY CONTEXT:
- Total Trades: ${tradeHistory.totalTrades}
- Win Rate: ${tradeHistory.winRate}%
- Average Return: ${tradeHistory.avgReturn}
- Best/Worst Performing Emotions: ${tradeHistory.emotionPerformance}

Please provide emotional guidance and trading insights based on both the current situation and historical performance patterns.
`;

  return await this.callDeepseek(userId, prompt, 'deepseek-reasoner');
}
```

### New API Endpoints
- `GET /api/trade-logs` - Get user's trade history
- `POST /api/trade-logs/import` - Manual import of trade files
- `GET /api/trade-logs/performance` - Get performance analytics
- `GET /api/trade-logs/emotional-patterns` - Get emotional performance correlations

## Future Enhancements (Back Burner)

### Emotional Pattern Tracking
- Track emotional states across multiple trades to identify recurring patterns
- Correlate specific emotions with trading performance outcomes
- Provide insights like "You tend to make your best trades when feeling calm and focused"

### Risk Level Adjustment
- Automatically adjust position sizing recommendations based on emotional state
- Implement risk scoring system that considers emotional stability
- Dynamic risk management based on current emotional context

### Post-Trade Emotional Reflection
- Add post-trade emotional assessment to close the feedback loop
- Compare pre-trade vs post-trade emotional states
- Use reflection to improve future emotional awareness

### Advanced Analytics
- Machine learning models for emotional pattern prediction
- Real-time emotional state monitoring during trades
- Integration with biometric data (heart rate, etc.) for enhanced emotional tracking

## Implementation Timeline

### Week 1: Configuration & Foundation Setup
- [ ] Implement Configuration database model and API endpoints
- [ ] Seed initial configuration data (assets, timeframes, emotions, body signals)
- [ ] Update frontend to fetch configurations from API
- [ ] Extend TradePlan data model with trading context

### Week 2: Enhanced AI Context & Analysis
- [ ] Implement trading context analysis endpoints
- [ ] Enhance AI service with context awareness
- [ ] Update frontend to display trading context
- [ ] Add performance stats display component

### Week 3: Image Analysis Integration
- [ ] Implement image upload and storage backend
- [ ] Integrate image analysis service (Clarifai/Google Vision)
- [ ] Create combined emotional analysis with image data
- [ ] Update modal with image upload UI and drag-and-drop

### Week 4: Timer & Workflow Management
- [ ] Implement break timer backend endpoints
- [ ] Create timer frontend component (5-minute countdown)
- [ ] Add workflow state management
- [ ] Implement status transitions and persistence

### Week 5: Enhanced Emotional Intelligence
- [ ] Implement dynamic questioning system
- [ ] Add progressive emotional assessment flow
- [ ] Create emotional pattern visualization
- [ ] Polish user experience and UI refinements

### Week 6: Caring Friend AI Personality
- [ ] Update AI personality configuration with caring friend tone
- [ ] Implement enhanced emotional response templates
- [ ] Add context-aware responses for different trading situations
- [ ] Test and refine AI communication style

### Week 7: MT5 Integration & Historical Analysis
- [ ] Develop MQL5 trade export script for MT5
- [ ] Set up Google Drive API integration
- [ ] Create TradeLog data model and import pipeline
- [ ] Implement enhanced AI analysis with historical data

### Week 8: Testing & Refinement
- [ ] User testing and feedback collection
- [ ] Performance optimization and bug fixes
- [ ] Security review and rate limiting implementation
- [ ] Documentation updates and deployment preparation

## Technical Considerations

### Security
- Validate all image uploads for file type and size
- Implement rate limiting for AI analysis requests
- Secure timer endpoints to prevent manipulation

### Performance
- Cache trading context calculations
- Implement background image processing
- Optimize AI prompt engineering for faster responses

### Scalability
- Design for concurrent user sessions
- Implement queue system for image analysis
- Plan for AI service rate limits

## Success Metrics

- Reduced emotional trading decisions
- Improved trade consistency
- Increased user engagement with emotional checks
- Positive user feedback on AI guidance quality

This development plan ensures that the existing AI personality is fully leveraged while adding the sophisticated emotional monitoring and context-aware features requested.

---

## Update - November 27, 2025

### Implemented
- Chat UX
  - Streaming-style replies (frontend simulation): Assistant messages type out character-by-character for a ChatGPT-like experience
  - Thinking process indicator: Rotating short status in chat header (“Reviewing your emotional state…”, “Checking today’s trading context…”, “Formulating a supportive response…”)
- Backend chat flow
  - Non-blocking chat endpoint: Returns AI response immediately and saves assistant message asynchronously to keep UI responsive
  - Response quality guard: Appends a gentle follow-up when the model returns very short content
  - Route ordering fix: Moved `/today-trades` above `/:id` to avoid parameter route capturing
- Model
  - `chatMessageSchema.content` default set to '' to avoid validation errors during streaming-style UI updates
- Trade Plan Details
  - Emotional check summary: Displays current emotion, body signals with intensity, optional notes, and Aria’s analysis

### Immediate Next Work
1. True server-driven streaming
   - Add Server-Sent Events (SSE) or fetch-stream chunk parsing to backend route(s) when the upstream model supports token streaming
   - Update frontend to consume streamed chunks for real-time rendering (replace current simulated typing)
2. Thinking indicator polish
   - Add graceful transition between “thinking” and “typing”
   - Allow user to cancel or skip a long response
3. Emotional details parity
   - Ensure Trade Plan Details mirror any new fields added to emotional check (e.g., future image analysis, timers)
4. Quality & resilience
   - Add rate limiting on chat endpoints
   - Improve error states for partial streaming (fallback to complete message)
5. Workflow extensions (from Phase 3 plan)
   - Implement 5-minute break timer endpoints and UI
   - Persist and display timer status in the modal and details
