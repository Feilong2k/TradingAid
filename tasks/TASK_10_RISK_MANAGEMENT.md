# Task #10 - Risk Management Rules & Workflow Navigation

## Overview
Implement comprehensive risk management system with user-defined rules and Aria integration for proactive risk enforcement. Add back button navigation between analysis and emotional check phases.

---

## Subtask 10.1 - Back Button for Emotional Check Navigation

│                                                                                   
│   Priority: high  Status: ○ pending                                               
│   Dependencies: 9.3 (Analysis Entry Creation UI)                                                              
│                                                                                   
│   Description: Add back button in AnalysisModal to return to Emotional Check phase
│   Allow users to navigate back to emotional check if they need to reassess their emotional state
│   Preserve emotional state data when navigating between phases
│                                                                                   
│   Files to Modify:                                                                
│   - frontend/src/components/AnalysisModal.vue (add back button + logic)          
│   - frontend/src/views/TradePlanning.vue (handle navigation events)              
│   - frontend/src/components/NewTradePlanModal.vue (preserve emotional state)     
│                                                                                   
│   Technical Details:                                                              
│   - New prop in AnalysisModal: `allowBackToEmotionalCheck`                       
│   - New emit event: `back-to-emotional-check`                                    
│   - Preserve emotional state in TradePlanning.vue state management               
│   - Update workflow state to handle bidirectional navigation

---

## Subtask 10.2 - Risk Management Rules Database Schema

│                                                                                   
│   Priority: high  Status: ○ pending                                               
│   Dependencies: #6 (MT5 logs)                                                              
│                                                                                   
│   Description: Create database schema for user risk management rules
│   Support multiple rule types with conditions, actions, and values
│   Track consecutive losses and daily performance for rule enforcement
│                                                                                   
│   Files to Create:                                                                
│   - backend/src/models/RiskRule.js (new risk rule schema)                        
│   - backend/src/models/TradingSession.js (session tracking)                      
│                                                                                   
│   Technical Details:                                                              
│   - RiskRule model with fields: `userId`, `ruleType`, `condition`, `action`, `value`, `isActive`
│   - Rule types: `max_trade_risk`, `consecutive_losses_stop`, `risk_reduction`, `daily_max_loss`
│   - Conditions: `always`, `after_consecutive_losses`, `daily_total`              
│   - Actions: `block_trading`, `reduce_risk`, `show_warning`                      
│   - TradingSession model for tracking active sessions and cooldowns

---

## Subtask 10.3 - Risk Rules Configuration UI

│                                                                                   
│   Priority: medium  Status: ○ pending                                               
│   Dependencies: 10.2 (Database schema)                                                              
│                                                                                   
│   Description: Create user interface for setting up risk management rules
│   Allow users to configure, enable/disable, and preview their risk rules
│   Provide visual feedback on current rule status and enforcement
│                                                                                   
│   Files to Create:                                                                
│   - frontend/src/views/RiskManagement.vue (new risk settings page)               
│   - frontend/src/stores/risk.js (risk state management)                          
│                                                                                   
│   Technical Details:                                                              
│   - Form-based interface for each rule type                                      
│   - Toggle switches to enable/disable rules                                      
│   - Real-time preview of rule conditions and actions                             
│   - Integration with existing styling and navigation

---

## Subtask 10.4 - Risk Rule Enforcement Engine

│                                                                                   
│   Priority: high  Status: ○ pending                                               
│   Dependencies: 10.2 (Database schema), #6 (MT5 logs)                                                              
│                                                                                   
│   Description: Implement backend logic to enforce risk rules automatically
│   Evaluate rules before trade plan creation and during trading sessions
│   Track consecutive losses, daily performance, and enforce cooldowns
│                                                                                   
│   Files to Create:                                                                
│   - backend/src/services/riskService.js (rule enforcement engine)                
│   - backend/src/routes/riskRules.js (risk rule management API)                   
│   - backend/src/routes/tradingSessions.js (session management API)               
│                                                                                   
│   Technical Details:                                                              
│   - Rule evaluation before trade plan creation                                   
│   - Consecutive loss tracking per user                                           
│   - Daily loss calculation and monitoring                                        
│   - Block trading sessions when conditions met                                   
│   - Automatic risk reduction enforcement

---

## Subtask 10.5 - Aria Risk Management Integration

│                                                                                   
│   Priority: high  Status: ○ pending                                               
│   Dependencies: 10.4 (Rule enforcement), #5 (Aria chat)                                                              
│                                                                                   
│   Description: Integrate Aria as proactive risk management assistant
│   Aria reminds users of risk rules and provides coaching on risk discipline
│   Real-time risk assessment during emotional check and trade planning
│                                                                                   
│   Files to Modify:                                                                
│   - backend/src/services/aiService.js (add risk assessment methods)              
│   - frontend/src/components/NewTradePlanModal.vue (Aria risk reminders)          
│   - frontend/src/components/AnalysisModal.vue (risk warnings)                    
│                                                                                   
│   Technical Details:                                                              
│   - Aria proactively reminds user of risk rules                                  
│   - Real-time risk assessment during emotional check                             
│   - Warning messages when approaching limits                                     
│   - Coaching on risk discipline and emotional control

---

## Subtask 10.6 - Trading Session Management

│                                                                                   
│   Priority: medium  Status: ○ pending                                               
│   Dependencies: 10.4 (Rule enforcement)                                                              
│                                                                                   
│   Description: Track trading sessions and enforce time-based rules
│   Implement 30-minute cooldown after 2 consecutive losses
│   Automatic risk reduction from 10% to 5% after losses
│   Daily loss limit enforcement and session blocking
│                                                                                   
│   Files to Modify:                                                                
│   - backend/src/services/riskService.js (session tracking)                       
│   - backend/src/models/TradingSession.js (enhance session model)                 
│   - frontend/src/stores/risk.js (session state management)                       
│                                                                                   
│   Technical Details:                                                              
│   - Session tracking with start/end times                                        
│   - 30-minute cooldown after 2 consecutive losses                                
│   - Automatic risk reduction (10% → 5%)                                          
│   - Daily loss limit enforcement                                                 
│   - Real-time session status display

---

## Specific Rule Implementation Details

### Rule 1: Max Per Trade Risk (10%)
- **Condition**: Always
- **Action**: Block trade creation if risk > 10%
- **Integration**: Check during trade plan creation
- **Enforcement**: RiskService.validateTradeRisk()

### Rule 2: Consecutive Losses Stop (2 losses → 30 min break)
- **Condition**: 2 consecutive completed trades with negative profit
- **Action**: Block new trades for 30 minutes
- **Integration**: Track trade outcomes, start cooldown timer
- **Enforcement**: RiskService.checkConsecutiveLosses()

### Rule 3: Risk Reduction After Losses (10% → 5%)
- **Condition**: 2 consecutive losses
- **Action**: Automatically reduce max risk to 5%
- **Integration**: Modify risk calculation in trade planning
- **Enforcement**: RiskService.applyRiskReduction()

### Rule 4: Daily Max Loss (30%)
- **Condition**: Daily cumulative loss reaches 30% of account
- **Action**: Block all trading for remainder of day
- **Integration**: Track daily profit/loss across all trades
- **Enforcement**: RiskService.checkDailyLossLimit()

---

## Implementation Order

1. **10.1** - Back button (immediate UX improvement)
2. **10.2** - Database schema (foundation)
3. **10.4** - Rule enforcement engine (core logic)
4. **10.3** - Configuration UI (user control)
5. **10.5** - Aria integration (AI assistance)
6. **10.6** - Session management (advanced features)

---

## Technical Specifications

### Database Schema Changes
```javascript
// RiskRule model
const riskRuleSchema = {
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ruleType: { 
    type: String, 
    enum: ['max_trade_risk', 'consecutive_losses_stop', 'risk_reduction', 'daily_max_loss'],
    required: true 
  },
  condition: {
    type: String,
    enum: ['always', 'after_consecutive_losses', 'daily_total'],
    required: true
  },
  action: {
    type: String,
    enum: ['block_trading', 'reduce_risk', 'show_warning'],
    required: true
  },
  value: { type: Number, required: true }, // e.g., 10 for 10%, 30 for 30 minutes
  isActive: { type: Boolean, default: true },
  consecutiveLossesThreshold: { type: Number, default: 2 }, // For consecutive losses rules
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
};

// TradingSession model
const tradingSessionSchema = {
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  status: { 
    type: String, 
    enum: ['active', 'cooldown', 'blocked', 'completed'],
    default: 'active'
  },
  consecutiveLosses: { type: Number, default: 0 },
  dailyLoss: { type: Number, default: 0 },
  currentRiskPercent: { type: Number, default: 10 }, // Default 10% risk
  cooldownEndTime: Date, // For 30-minute breaks
  dailyBlocked: { type: Boolean, default: false } // Daily loss limit reached
};
```

### API Routes
- `GET /api/risk-rules` - Get user's risk rules
- `POST /api/risk-rules` - Create new risk rule
- `PUT /api/risk-rules/:id` - Update risk rule
- `DELETE /api/risk-rules/:id` - Delete risk rule
- `GET /api/trading-sessions/current` - Get current trading session
- `POST /api/trading-sessions/start` - Start new trading session
- `POST /api/trading-sessions/end` - End current trading session
- `POST /api/risk/validate-trade` - Validate trade against risk rules

### Integration Points
- Extend trade plan creation to check risk rules
- Integrate with MT5 trade logs for loss tracking
- Add risk warnings to emotional check and analysis modals
- Use existing Aria chat infrastructure for risk coaching
- Maintain consistent UI/UX with existing components

---

## Estimated Effort
- **High Priority Subtasks (10.1, 10.2, 10.4, 10.5)**: 3-4 days
- **Medium Priority Subtasks (10.3, 10.6)**: 2-3 days
- **Total Estimated**: 5-7 days

Ready to begin implementation with Subtask 10.1 - Back Button for Emotional Check Navigation.
