# Task #9 - Multi-timeframe Analysis Workflow - Complete Subtask Breakdown

## Overview
Support multiple analysis entries per plan (LTF/MTF/HTF) with one or more screenshots and notes. Allow user to declare directional bias; Aria produces technical assessment. Show chronological analysis log per plan with filters by timeframe.

**Timeframe Hierarchy**: Dynamic based on plan selection (e.g., M15=HTF, M5=MTF, M1=LTF)

---

## Technical Analysis Grading System

### 7 Technical Elements with Grading Values:

**1. Trend** (-2 to +2)
- Up trending, and price closed above 10 MA: +2
- Up consolidation, overall up trend, but price closed below 10 MA: +1
- Down trending, and price closed below 10 MA: -2
- Down consolidation, overall down trend, but price closed below 10 MA: -1
- Unclear, no clearly identifiable trend: 0

**2. CHoCH** (-3 to +3)
- No Recent Changes: 0
- Up trend broken: -1
- Down trend broken: +1
- Up Trend confirmed but not verified: +2
- Down trend confirmed but not verified: -2
- Up trend verified but not confirmed: +2
- Down trend verified but not confirmed: -2
- Up trend confirmed and verified: +3
- Down trend confirmed and verified: -3

**3. Divergence** (-2 to +2)
- No divergence is not present: 0
- 5 Waves up and divergence: -2
- 5 Waves down and divergence: +2
- 3 Waves up and divergence: -1
- 3 Waves down and divergence: +1

**4. Stochastics** (-1 to +1)
- Oversold: +1
- Overbought: -1
- Moving up: +1
- Moving down: -1
- Directionless: 0
- Divergence around Overbought: -1
- Divergence around Oversold: +1

**5. Time Criteria** (-1 to +1)
- Uptrend consolidation time met: +1
- Downtrend consolidation time met: -1
- Uptrend time not over: +1
- Downtrend time not over: -1
- Consolidation time not met: 0
- Trend time over: 0
- Time criteria not valid: 0

**6. ATR Analysis** (-2 to +2)
- Up candle High, (>30%): +2
- Down candle High, (>30%): -2
- Up candle Medium (< 30%, > -30%): +1
- Down candle Medium (< 30%, > -30%): -1
- Low: 0

**7. Moving Averages** (-2 to +2)
- Point of crossing up: +2
- MAs fanning up: +1
- Point of crossing down: -2
- MAs fanning down: -1
- Unclear: 0

### Decision Thresholds:
- **Long Focus**: Total Grade > 5
- **Short Focus**: Total Grade < -5
- **Unclear**: Between -5 and +5

---

## Analysis Workflow

### Phase 1: Individual Timeframe Analysis
1. Analyze HTF first, then MTF, then LTF
2. For each timeframe, grade all 7 technical elements
3. Calculate total grade and directional bias automatically

### Phase 2: Overall Direction Determination (Discretionary)
- Review all three timeframe analyses
- Make discretionary decision on overall direction (long/short/unclear)

### Phase 3: Trade Decision Logic
1. **If signal direction = overall direction AND = LTF direction** → Trade signal direction
2. **If signal direction ≠ overall direction BUT overall direction = LTF direction** → Trade overall direction
3. **If signal direction ≠ overall direction BUT signal direction = LTF direction** → Trade signal direction
4. **If overall direction is unclear** → Wait for MTF/LTF changes

---

## Subtask 9.1 - Database Schema Extensions

│                                                                                   
│   Priority: high  Status: ✅ completed                                               
│   Dependencies: #4 (Trade planning)                                                              
│                                                                                   
│   Description: Extend TradePlan schema to support 7-element grading system.      
│   Add AnalysisEntry subdocument with fields for each technical element selection, 
│   timeframe designation (HTF/MTF/LTF), Aria assessment with versioning,          
│   screenshot support with individual notes, and dynamic grade calculation.        
│   Support multiple analysis entries per plan with relative timeframe designation.

---

## Subtask 9.2 - Backend API Endpoints

│                                                                                   
│   Priority: high  Status: ✅ completed                                               
│   Dependencies: 9.1 (Database schema)                                                              
│                                                                                   
│   Description: Create new API endpoints:                                           
│   - POST /api/trade-plans/:id/analysis-entries (create new analysis entry)        
│   - GET /api/trade-plans/:id/analysis-entries (list all entries)                  
│   - PUT /api/trade-plans/:id/analysis-entries/:entryId (update entry)             
│   - DELETE /api/trade-plans/:id/analysis-entries/:entryId (remove entry)          
│   - POST /api/trade-plans/:id/analysis-entries/:entryId/aria-assessment (manual Aria trigger)
│   Implement automatic grade calculation and directional bias determination.       
│   Enforce HTF single-entry constraint, allow multiple for MTF/LTF/overall.

---

## Subtask 9.3 - Analysis Entry Creation UI

│                                                                                   
│   Priority: high  Status: ✅ completed                                               
│   Dependencies: 9.2 (Backend API)                                                              
│                                                                                   
│   Description: Created sequential analysis workflow triggered after emotional check.
│   Auto-opens HTF analysis modal when user clicks "Proceed" in emotional check.     
│   Implemented separate modal for each timeframe (HTF→MTF→LTF) with navigation.      
│   Form includes 7 technical element dropdowns with real-time grade calculation.   
│   Supports multiple screenshot uploads with URL + note fields.                     
│   Maintains chat accessibility throughout workflow. Implemented form validation.
│                                                                                   
│   Files Created/Modified:                                                         
│   - frontend/src/components/AnalysisModal.vue (new)                              
│   - docs/KNOWLEDGE_TRANSFER.md (updated)                                         
│   - docs/TRADING_PLAN_MODAL_DEVELOPMENT_PLAN.md (updated)                        
│   - tasks/TASK_9_SUBTASKS.md (updated)                                           
│                                                                                   
│   Key Features Implemented:                                                       
│   - Split-pane layout with chat on left, analysis form on right                  
│   - Real-time grade calculation with visual indicators                           
│   - Multiple screenshot uploads with plus button                                 
│   - Sequential workflow navigation (Back/Next buttons)                           
│   - Form validation requiring all 7 technical elements                           
│   - Integration-ready with existing backend API endpoints

---

## Subtask 9.4 - TradePlanDetailsModal Technical Analysis Sections

│                                                                                   
│   Priority: high  Status: ○ pending                                               
│   Dependencies: 9.3 (UI)                                                              
│                                                                                   
│   Description: Update TradePlanDetailsModal to display technical analysis entries
│   with separate sections for HTF, MTF, LTF analysis. Show 7-element grading with
│   calculated scores, Aria technical assessments, screenshots and notes for each
│   analysis entry. Support navigation from analysis modal via back button.
│                                                                                   
│   Files to Modify:                                                                
│   - frontend/src/components/TradePlanDetailsModal.vue (add technical analysis sections)
│   - frontend/src/views/TradePlanning.vue (navigation state management)           
│                                                                                   
│   Technical Details:                                                              
│   - Add expandable sections for HTF/MTF/LTF analysis                             
│   - Display 7-element grading with visual score indicators                       
│   - Show Aria technical assessments with structured breakdown                    
│   - Include screenshot galleries for each timeframe                              
│   - Support back button navigation from AnalysisModal

---

## Subtask 9.5 - Aria Technical Assessment Integration

│                                                                                   
│   Priority: high  Status: ○ pending                                               
│   Dependencies: 9.3 (UI), #5 (Aria chat)                                                              
│                                                                                   
│   Description: When user submits analysis entry, automatically generate Aria      
│   technical assessment immediately for each timeframe and overall analysis.      
│   Extend AI service to understand the 7-element grading system and provide       
│   structured technical feedback with: 1) structured breakdown of 7 elements with 
│   commentary, 2) free-form analysis, 3) trade recommendation. Store assessment   
│   with entry and show error message with retry option on failure.

---

## Subtask 9.6 - Analysis Timeline Display

│                                                                                   
│   Priority: medium  Status: ○ pending                                               
│   Dependencies: 9.3 (UI)                                                              
│                                                                                   
│   Description: Create chronological timeline view of all analysis entries         
│   within trade plan details modal. Show entries with timeframe badges,            
│   directional bias indicators, and expandable sections for full details.

---

## Subtask 9.6 - Timeframe Filtering

│                                                                                   
│   Priority: medium  Status: ○ pending                                               
│   Dependencies: 9.5 (Timeline display)                                                              
│                                                                                   
│   Description: Add timeframe filter controls to analysis timeline.                
│   Allow filtering by HTF/MTF/LTF or combinations. Implement real-time             
│   filtering without page reload.

---

## Subtask 9.7 - Screenshot Gallery Integration

│                                                                                   
│   Priority: medium  Status: ○ pending                                               
│   Dependencies: 9.3 (UI), #6 (MT5 logs)                                                              
│                                                                                   
│   Description: Integrate screenshot upload functionality from existing            
│   Google Drive service. Allow multiple screenshots per analysis entry.            
│   Create thumbnail gallery within each analysis entry.

---

## Subtask 9.8 - Decision Logic Workflow

│                                                                                   
│   Priority: high  Status: ○ pending                                               
│   Dependencies: 9.3 (UI), 9.5 (Timeline display)                                                              
│                                                                                   
│   Description: Implement the 4-rule decision logic for trade direction.           
│   Create interface for discretionary overall direction selection.                 
│   Visualize decision logic outcomes and provide guidance for next steps.

---

## Subtask 9.9 - Analysis Entry Editing

│                                                                                   
│   Priority: low  Status: ○ pending                                               
│   Dependencies: 9.3 (UI)                                                              
│                                                                                   
│   Description: Add edit functionality for existing analysis entries.              
│   Allow users to update technical element selections and notes.                   
│   Track edit history for audit purposes.

---

## Subtask 9.10 - Export and Reporting

│                                                                                   
│   Priority: low  Status: ○ pending                                               
│   Dependencies: 9.5 (Timeline display)                                                              
│                                                                                   
│   Description: Add export functionality for analysis timeline.                    
│   Generate PDF reports of all analysis entries with screenshots and               
│   technical assessments for review and sharing.

---

## Subtask 9.11 - Bug Fixes and UI Improvements

│                                                                                   
│   Priority: high  Status: ✅ completed                                               
│   Dependencies: 9.3 (Analysis Entry Creation UI)                                                              
│                                                                                   
│   Description: Fixed critical bugs and improved UI consistency:                      
│   - ✅ Fixed SSE streaming connection status bug ("retrying to connect" message appears when Aria successfully replies)
│   - ✅ Updated AnalysisModal titles to match emotional check modal format: "BTC 15m long signal - 11/28/2025, 7:54:32AM, HTF Analysis"
│   - ✅ Connected "Continue Plan" button in TradePlanDetailsModal to open HTF analysis modal
│   - ✅ Ensured proper trade plan data flow between components
│                                                                                   
│   Files Modified:                                                                
│   - frontend/src/components/TradePlanDetailsModal.vue                            
│   - frontend/src/components/AnalysisModal.vue                                   
│   - frontend/src/views/TradePlanning.vue                                        
│   - docs/KNOWLEDGE_TRANSFER.md                                                  
│                                                                                   
│   Key Fixes Implemented:                                                                     
│   - Improved SSE streaming state management                                       
│   - Added trade plan details props to AnalysisModal                               
│   - Updated modal title formatting                                                
│   - Connected continue plan workflow to analysis modal
│   - Added analysis workflow state management in TradePlanning.vue
│   - Updated documentation to reflect fixes

---

## Implementation Order

1. **9.1** - Database Schema Extensions (foundation)
2. **9.2** - Backend API Endpoints (data layer)
3. **9.3** - Analysis Entry Creation UI (user interface)
4. **9.8** - Decision Logic Workflow (core functionality)
5. **9.4** - Aria Technical Assessment Integration (AI enhancement)
6. **9.5** - Analysis Timeline Display (visualization)
7. **9.7** - Screenshot Gallery Integration (media handling)
8. **9.6** - Timeframe Filtering (user experience)
9. **9.9** - Analysis Entry Editing (feature completeness)
10. **9.10** - Export and Reporting (advanced features)

---

## Technical Specifications

### Database Schema Changes
```javascript
// Add to TradePlan schema
analysisEntries: [{
  timeframe: { type: String, enum: ['HTF', 'MTF', 'LTF'], required: true },
  
  // 7 Technical Element Selections (store selections only, calculate grades dynamically)
  trend: { type: String, enum: ['up_trending_above_ma', 'up_consolidation', 'down_trending_below_ma', 'down_consolidation', 'unclear'] },
  choch: { type: String, enum: ['no_change', 'up_trend_broken', 'down_trend_broken', 'up_confirmed_not_verified', 'down_confirmed_not_verified', 'up_verified_not_confirmed', 'down_verified_not_confirmed', 'up_confirmed_verified', 'down_confirmed_verified'] },
  divergence: { type: String, enum: ['none', 'five_waves_up_divergence', 'five_waves_down_divergence', 'three_waves_up_divergence', 'three_waves_down_divergence'] },
  stochastics: { type: String, enum: ['oversold', 'overbought', 'moving_up', 'moving_down', 'directionless', 'divergence_overbought', 'divergence_oversold'] },
  timeCriteria: { type: String, enum: ['uptrend_consolidation_met', 'downtrend_consolidation_met', 'uptrend_time_not_over', 'downtrend_time_not_over', 'consolidation_not_met', 'trend_time_over', 'not_valid'] },
  atrAnalysis: { type: String, enum: ['up_candle_high', 'down_candle_high', 'up_candle_medium', 'down_candle_medium', 'low'] },
  movingAverages: { type: String, enum: ['crossing_up', 'fanning_up', 'crossing_down', 'fanning_down', 'unclear'] },
  
  // Calculated Values (computed on the fly)
  // Note: Grades are calculated dynamically from selections above
  
  // Discretionary Fields
  discretionaryOverallDirection: { type: String, enum: ['long', 'short', 'unclear'] },
  notes: String,
  
  // Media - Support both MT5 files and TradingView links
  screenshots: [{
    url: String,
    filename: String,
    uploadedAt: Date,
    type: { type: String, enum: ['mt5_file', 'tradingview_link'], default: 'mt5_file' },
    note: String, // Individual screenshot notes
    // Naming convention for MT5 files: TP_{planId}_{timeframe}_{timestamp}_{asset}.png
  }],
  
  // AI Assessment with Versioning
  technicalAssessment: {
    text: String,
    modelVersion: String,
    promptVersion: String,
    confidenceScore: Number,
    assessmentTimestamp: { type: Date, default: Date.now }
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
}]
```

### Indexing Strategy
- No additional indexes required (small data volume per plan)
- Rely on existing trade plan indexes for efficient queries

### API Routes
- `POST /api/trade-plans/:id/analysis-entries`
- `GET /api/trade-plans/:id/analysis-entries` 
- `PUT /api/trade-plans/:id/analysis-entries/:entryId`
- `DELETE /api/trade-plans/:id/analysis-entries/:entryId`

### UI Components Needed
- `AnalysisEntryForm.vue` - Create/edit analysis entries with 7-element grading
- `AnalysisTimeline.vue` - Display chronological entries
- `TimeframeFilter.vue` - Filter controls
- `AnalysisEntryCard.vue` - Individual entry display
- `DecisionLogicWorkflow.vue` - 4-rule decision logic interface
- `OverallAnalysisModal.vue` - Summary table, 4-rule decision logic, overall direction selection, screenshot attachment with individual notes

### Integration Points
- Extend existing trade plan details modal
- Reuse screenshot upload from trade logs
- Integrate with Aria chat service for technical assessments
- Maintain consistent styling with existing components

---

## Estimated Effort
- **High Priority Subtasks (9.1-9.4, 9.8)**: 3-4 days
- **Medium Priority Subtasks (9.5-9.7)**: 2-3 days  
- **Low Priority Subtasks (9.9-9.10)**: 1-2 days
- **Total Estimated**: 6-9 days

Ready to begin implementation with Subtask 9.1 - Database Schema Extensions.
