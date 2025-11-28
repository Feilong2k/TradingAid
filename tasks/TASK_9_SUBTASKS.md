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
│   Priority: high  Status: ✅ completed                                               
│   Dependencies: 9.3 (UI)                                                               
│                                                                                   
│   Description: Updated TradePlanDetailsModal to display technical analysis entries
│   with separate sections for HTF, MTF, LTF analysis. Implemented 7-element grading 
│   with calculated scores, directional bias determination, Aria technical assessments, 
│   screenshots and notes for each analysis entry. Added comprehensive helper methods
│   for real-time grade calculation and visual indicators.
│                                                                                   
│   Files Modified:                                                                
│   - frontend/src/components/TradePlanDetailsModal.vue (added technical analysis sections)
│   - docs/KNOWLEDGE_TRANSFER.md (updated implementation details)                  
│                                                                                   
│   Key Features Implemented:                                                       
│   - ✅ Separate expandable sections for HTF/MTF/LTF analysis                      
│   - ✅ Real-time 7-element grading with visual score indicators                   
│   - ✅ Automatic directional bias determination (long/short/unclear)              
│   - ✅ Support for Aria technical assessments with structured display             
│   - ✅ Screenshot galleries with individual notes for each timeframe              
│   - ✅ Responsive grid-based layout with visual indicators                        
│   - ✅ Complete grade mapping for all 7 technical elements                        
│   - ✅ Computed properties for timeframe filtering and entry detection            
│   - ✅ Helper methods for value formatting, grade calculation, and bias determination
│                                                                                   
│   Technical Implementation:                                                       
│   - Added comprehensive helper methods for technical analysis                     
│   - Implemented computed properties for timeframe-specific analysis entries       
│   - Created responsive CSS styling for analysis sections                          
│   - Added visual indicators for grades and directional bias                       
│   - Integrated with existing backend API data structure

---

## Subtask 9.5 - Aria Technical Assessment Integration

│                                                                                   
│   Priority: high  Status: ✅ completed                                               
│   Dependencies: 9.3 (UI), #5 (Aria chat)                                                               
│                                                                                   
│   Description: Implemented automatic Aria technical assessment generation when   
│   user submits analysis entries. Extended AI service to understand the 7-element 
│   grading system and provide structured technical feedback with: 1) structured   
│   breakdown of 7 elements with commentary, 2) free-form analysis, 3) trade      
│   recommendation. Store assessment with entry and handle errors gracefully.      
│                                                                                   
│   Files Modified:                                                                
│   - backend/src/services/aiService.js (added generateTechnicalAssessment method) 
│   - backend/src/routes/tradePlans.js (added automatic assessment generation)     
│   - docs/KNOWLEDGE_TRANSFER.md (updated implementation details)                  
│                                                                                   
│   Key Features Implemented:                                                       
│   - ✅ Automatic Aria assessment generation on analysis entry submission         
│   - ✅ Structured technical feedback with 3-section format                       
│   - ✅ Integration with 7-element grading system and calculated metrics          
│   - ✅ Background processing to avoid blocking user response                     
│   - ✅ Graceful error handling with fallback responses                           
│   - ✅ Assessment versioning and confidence scoring                              
│   - ✅ Manual assessment trigger endpoint for retry capability                   
│                                                                                   
│   Technical Implementation:                                                       
│   - Added `generateTechnicalAssessment()` method to AI service                   
│   - Extended analysis entry creation to trigger background assessment            
│   - Implemented comprehensive prompt engineering for technical analysis          
│   - Added fallback responses for when AI service is unavailable                  
│   - Maintained conversation history continuity for user context                  
│   - Integrated with existing trade plan data structure

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

## Subtask 9.7 - Timeframe Filtering

│                                                                                   
│   Priority: medium  Status: ○ pending                                               
│   Dependencies: 9.6 (Timeline display)                                                              
│                                                                                   
│   Description: Add timeframe filter controls to analysis timeline.                
│   Allow filtering by HTF/MTF/LTF or combinations. Implement real-time             
│   filtering without page reload.

---

## Subtask 9.8 - Screenshot Gallery Integration

│                                                                                   
│   Priority: medium  Status: ○ pending                                               
│   Dependencies: 9.3 (UI), #6 (MT5 logs)                                                              
│                                                                                   
│   Description: Integrate screenshot upload functionality from existing            
│   Google Drive service. Allow multiple screenshots per analysis entry.            
│   Create thumbnail gallery within each analysis entry.

---

## Subtask 9.9 - Decision Logic Workflow

│                                                                                   
│   Priority: high  Status: ○ pending                                               
│   Dependencies: 9.3 (UI), 9.6 (Timeline display)                                                              
│                                                                                   
│   Description: Implement the 4-rule decision logic for trade direction.           
│   Create interface for discretionary overall direction selection.                 
│   Visualize decision logic outcomes and provide guidance for next steps.

---

## Subtask 9.10 - Analysis Entry Editing

│                                                                                   
│   Priority: low  Status: ○ pending                                               
│   Dependencies: 9.3 (UI)                                                              
│                                                                                   
│   Description: Add edit functionality for existing analysis entries.              
│   Allow users to update technical element selections and notes.                   
│   Track edit history for audit purposes.

---

## Subtask 9.11 - Export and Reporting

│                                                                                   
│   Priority: low  Status: ○ pending                                               
│   Dependencies: 9.6 (Timeline display)                                                              
│                                                                                   
│   Description: Add export functionality for analysis timeline.                    
│   Generate PDF reports of all analysis entries with screenshots and               
│   technical assessments for review and sharing.

---

## Subtask 9.12 - AnalysisModal Bug Fixes and UI Improvements

│                                                                                   
│   Priority: high  Status: ○ pending                                               
│   Dependencies: 9.3 (Analysis Entry Creation UI)                                                              
│                                                                                   
│   Description: Fix critical bugs and improve AnalysisModal UX:                      
│   - Fix 403 Forbidden error by updating token storage key from 'token' to 'auth_token'
│   - Always show back button in all timeframes (HTF/MTF/LTF) for emotional check review
│   - Add separate "Get Aria Analysis" button for immediate technical assessment feedback
│   - Update button layout and styling for better navigation
│   - Improve form validation UX with better visual feedback
│                                                                                   
│   Files to Modify:                                                                
│   - frontend/src/components/AnalysisModal.vue                                   
│   - docs/KNOWLEDGE_TRANSFER.md                                                  
│                                                                                   
│   Key Features to Implement:                                                                      
│   - Fixed authentication token handling                                          
│   - Consistent back button visibility across all analysis stages                 
│   - Separate Aria analysis preview functionality                                 
│   - Enhanced navigation and user experience                                      
│   - Better form validation and error handling

---

## NEW SUBTASKS - Dual Persona System & API Fixes

## Subtask 9.13 - Dual Persona System: Wesley Technical Analyst

│                                                                                   
│   Priority: high  Status: ○ pending                                               
│   Dependencies: 9.3 (Analysis Entry Creation UI)                                                              
│                                                                                   
│   Description: Create dedicated technical analyst persona "Wesley" to separate   
│   emotional support (Aria) from technical analysis. Implement dual-persona system
│   with separate conversation storage and distinct communication styles.
│                                                                                   
│   Files to Create/Modify:                                                         
│   - backend/src/config/aiPersonality.js (add Wesley persona)                    
│   - frontend/src/components/TradePlanDetailsModal.vue (add dual tabs)           
│   - backend/src/routes/tradePlans.js (add Wesley conversation storage)          
│                                                                                   
│   Key Features to Implement:                                                     
│   - Wesley persona: Male technical analyst focused on data-driven analysis      
│   - Dual tabs in TradePlanDetailsModal: Aria (emotional) and Wesley (technical) 
│   - Separate conversation storage for each persona                              
│   - Distinct visual styling (colors, avatars) for each persona                  
│   - Analysis type dropdown in Wesley tab for HTF/MTF/LTF selection              
│   - Modal triggers: Aria tab → Emotional Check-in, Wesley tab → Analysis Modal  
│   - Wesley responses focus on opinions, not repetition of user inputs

---

## Subtask 9.14 - Backend API Fixes and Data Persistence

│                                                                                   
│   Priority: critical  Status: ○ pending                                               
│   Dependencies: 9.2 (Backend API), 9.3 (UI)                                                              
│                                                                                   
│   Description: Fix critical backend API issues and ensure proper data persistence
│   for analysis entries. Resolve "I encountered an error submitting your analysis" 
│   error and ensure all data is properly saved to MongoDB.
│                                                                                   
│   Files to Modify:                                                                
│   - backend/src/routes/tradePlans.js (fix analysis entry endpoints)             
│   - backend/src/models/TradePlan.js (ensure proper schema validation)           
│   - frontend/src/components/AnalysisModal.vue (fix API calls)                  
│                                                                                   
│   Key Features to Implement:                                                     
│   - Fix POST /api/trade-plans/:id/analysis-entries endpoint                     
│   - Ensure all analysis form data is saved to MongoDB                           
│   - Save chat conversations with analysis entries                               
│   - Fix Next button functionality to properly save data                         
│   - Add proper error handling and validation                                    
│   - Test data persistence across all timeframes

---

## Subtask 9.15 - UI Improvements and Screenshot Integration

│                                                                                   
│   Priority: high  Status: ○ pending                                               
│   Dependencies: 9.3 (UI), 9.13 (Dual Persona)                                                              
│                                                                                   
│   Description: Implement UI improvements and screenshot integration features     
│   discussed during planning. Enhance user experience with better visual feedback
│   and screenshot handling.
│                                                                                   
│   Files to Modify:                                                                
│   - frontend/src/components/AnalysisModal.vue (UI improvements)                
│   - frontend/src/components/TradePlanDetailsModal.vue (screenshot integration)  
│                                                                                   
│   Key Features to Implement:                                                     
│   - Rename "Get Aria Analysis" button to "Technical Analysis"                   
│   - Add screenshot thumbnails in chat with click-to-expand functionality       
│   - Ensure Wesley AI can access and analyze screenshot content                  
│   - Improve error messages with specific guidance                               
│   - Add visual indicators for successful data saving                            
│   - Implement loading states for all API operations

---

##
