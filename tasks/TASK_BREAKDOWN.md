# TradingAid2 - Task Breakdown

## Task #1 - Database schema and indexing (MongoDB/Mongoose)   
│                                                                                   
│   Priority: high  Status: ✅ completed                                               
│   Dependencies: None                                                              
│                                                                                   
│   Description: Design and implement MongoDB schemas to persist users, API key     
│   mapping, trade plans, emotional entries, chat messages, trade logs, assets.     
│   Add required indexes and constraints to support idempotent ingestion, valid     
│   status transitions, and efficient queries.

---

## Task #2 - Authentication and authorization system   
│                                                                                   
│   Priority: high  Status: ✅ completed                                               
│   Dependencies: #1 (Database schema)                                                              
│                                                                                   
│   Description: Implement Google OAuth 2.0 login flow with JWT issuance.           
│   Create protected API routes with JWT validation returning 401 on invalid tokens.
│   Implement frontend route guards redirecting unauthenticated users to /login.    
│   Add admin controls with allow-listed emails (requireAdmin middleware).

---

## Task #3 - Configurations management   
│                                                                                   
│   Priority: high  Status: ✅ completed                                               
│   Dependencies: #1 (Database schema)                                                              
│                                                                                   
│   Description: Create /api/config endpoint to serve assets, timeframe collections, 
│   emotions, and body signals. Implement development fallbacks when API unreachable.
│   Add authenticated asset management (auth-only per latest policy).

---

## Task #4 - Trade planning and emotional check workflow   
│                                                                                   
│   Priority: high  Status: ✅ completed                                               
│   Dependencies: #1 (Database schema), #2 (Authentication)                                                          
│                                                                                   
│   Description: Implement trade plan creation with default status 'open'.           
│   Build emotional check capture with emotion, body signals (1-10), and notes.     
│   Add payload sanitation (filter empty signals, clamp intensity).                 
│   Implement status transitions (open → emotional_check → entered/passed_over/cancelled/completed).

---

## Task #5 - Aria chat via SSE streaming   
│                                                                                   
│   Priority: high  Status: ✅ completed                                               
│   Dependencies: #1 (Database schema), #4 (Trade planning)                                                          
│                                                                                   
│   Description: Implement SSE streaming for Aria responses with thinking → typing  
│   indicators and auto-scroll chat. Add instant local system onboarding message    
│   on modal open. Provide bundled non-stream fallback on SSE failure without 500.  
│   Ensure first token ≤ 1.5s p95 in dev/local.

---

## Task #6 - MT5 trade logs ingestion and query system   
│                                                                                   
│   Priority: high  Status: ✅ completed                                               
│   Dependencies: #1 (Database schema), #2 (Authentication)                                                          
│                                                                                   
│   Description: Build POST /api/trade-logs with user resolution (JWT → ApiKey map).
│   Create GET /api/trade-logs with filters, sorting, pagination.                   
│   Implement idempotency safeguards by ticket. Add screenshot upload to Google     
│   Drive with link persistence.

---

## Task #7 - Journal history and details modal   
│                                                                                   
│   Priority: high  Status: ✅ completed                                               
│   Dependencies: #4 (Trade planning), #5 (Aria chat)                                                          
│                                                                                   
│   Description: Create completed plans listing with summaries. Build details modal 
│   to review plan data, emotional state, and full conversation. Ensure navigation  
│   consistency with "Journal History" labels.

---

## Task #8 - Validation, security, and admin controls   
│                                                                                   
│   Priority: medium  Status: ⚠️ partial                                               
│   Dependencies: #2 (Authentication)                                                              
│                                                                                   
│   Description: Implement Joi validation across all public endpoints.              
│   Use environment variables for all secrets and integration parameters.           
│   Add httpOnly cookie auth, rate limiting for /auth and chat endpoints,           
│   CSRF protection for mutating endpoints.

---

## Task #9 - Multi-timeframe analysis workflow   
│                                                                                   
│   Priority: high  Status: ○ pending                                               
│   Dependencies: #4 (Trade planning), #5 (Aria chat)                                                          
│                                                                                   
│   Description: Support multiple analysis entries per plan (LTF/MTF/HTF) with      
│   one or more screenshots and notes. Allow user to declare directional bias;      
│   Aria produces technical assessment. Show chronological analysis log per plan    
│   with filters by timeframe.

---

## Task #10 - Entry trigger checklist and risk controls   
│                                                                                   
│   Priority: high  Status: ○ pending                                               
│   Dependencies: #4 (Trade planning), #9 (Multi-timeframe analysis)                                                          
│                                                                                   
│   Description: Build entry trigger checklist to compute entry, stop loss,         
│   position size based on risk configuration. Persist computed results to plan     
│   with edit history/versioning.

---

## Task #11 - Intratrade analysis and emotional check-ins   
│                                                                                   
│   Priority: high  Status: ○ pending                                               
│   Dependencies: #4 (Trade planning), #9 (Multi-timeframe analysis)                                                          
│                                                                                   
│   Description: Add multiple ongoing LTF/MTF technical analyses during trade.      
│   Implement periodic emotional check-ins during trade with timestamps.            
│   Create timeline filters by type/timeframe (technical vs emotional).

---

## Task #12 - Link executions to plans   
│                                                                                   
│   Priority: medium  Status: ○ pending                                               
│   Dependencies: #4 (Trade planning), #6 (MT5 logs)                                                          
│                                                                                   
│   Description: Auto-link MT5 executions to plan by plan ID/ticket association.    
│   Support multiple positions/executions (scale in/out) under plan with per-       
│   execution and aggregate P/L. Create unified screenshot gallery accessible       
│   from both plan and logs.

---

## Task #13 - Post-trade review system   
│                                                                                   
│   Priority: medium  Status: ○ pending                                               
│   Dependencies: #4 (Trade planning), #5 (Aria chat), #6 (MT5 logs)                                                          
│                                                                                   
│   Description: Provide structured post-trade review template (what worked,        
│   deviations, lessons, actions). Generate Aria summary referencing plan/log/      
│   emotional history.

---

## Task #14 - TradingView integration   
│                                                                                   
│   Priority: low  Status: ○ pending                                               
│   Dependencies: #4 (Trade planning)                                                              
│                                                                                   
│   Description: Integrate TradingView charts for in-app analysis. Save annotated   
│   chart snapshots to plan gallery with metadata.

---

## Task #15 - In-app trade placement   
│                                                                                   
│   Priority: low  Status: ○ pending                                               
│   Dependencies: #10 (Entry trigger checklist), #14 (TradingView)                                                          
│                                                                                   
│   Description: Enable order placement from app based on entry checklist           
│   (broker API TBD). Capture execution feedback and reconcile with logs and        
│   plan's executions view.

---

## Task #16 - Aria longitudinal coaching and learning   
│                                                                                   
│   Priority: low  Status: ○ pending                                               
│   Dependencies: #4 (Trade planning), #5 (Aria chat), #13 (Post-trade review)                                                          
│                                                                                   
│   Description: Provide habit insights and improvement suggestions across plans.   
│   Improve TA prompts/outputs over time based on user patterns.

---

## Task #17 - Reliability and observability   
│                                                                                   
│   Priority: medium  Status: ⚠️ partial                                               
│   Dependencies: #2 (Authentication), #5 (Aria chat), #6 (MT5 logs)                                                          
│                                                                                   
│   Description: Implement graceful AI fallback responses on provider failures.     
│   Gate logs via NODE_ENV/DEBUG to reduce noise in production. Add event logging   
│   for trade ingested, screenshot uploaded, emotional check submitted, SSE start/end.

---

## Task Dependencies Graph

```
1 (Database) → 2 (Auth) → 3 (Config) → 4 (Planning) → 5 (Aria Chat) → 9 (MTF) → 10 (Entry) → 11 (Intratrade)
              ↓          ↓           ↓              ↓              ↓
              6 (MT5 Logs) → 12 (Link Executions) → 13 (Post-trade) → 16 (Coaching)
              ↓
              8 (Security) → 17 (Observability)
              
4 (Planning) → 14 (TradingView) → 15 (In-app Orders)
```

## Implementation Priority Order

1. #1 - Database schema and indexing
2. #2 - Authentication and authorization system  
3. #3 - Configurations management
4. #4 - Trade planning and emotional check workflow
5. #6 - MT5 trade logs ingestion and query system
6. #5 - Aria chat via SSE streaming
7. #7 - Journal history and details modal
8. #8 - Validation, security, and admin controls
9. #17 - Reliability and observability
10. #9 - Multi-timeframe analysis workflow
11. #10 - Entry trigger checklist and risk controls
12. #11 - Intratrade analysis and emotional check-ins
13. #12 - Link executions to plans
14. #13 - Post-trade review system
15. #14 - TradingView integration
16. #15 - In-app trade placement
17. #16 - Aria longitudinal coaching and learning
