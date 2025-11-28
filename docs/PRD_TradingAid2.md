# TradingAid2 - Product Requirements Document (PRD)
Version: 1.0  
Date: 2025-11-27  
Owner: Lei Wang  
Status: Draft

1. Executive Summary
TradingAid2 is a psychological trading assistant that integrates emotional discipline with structured trading workflows. This PRD formalizes product goals, scope, and acceptance criteria across the current application and the near-term roadmap, incorporating the newly-delivered MT5 EA ingestion and Trade Logs system. The document also sets guardrails for quality, security, and architecture and describes a phased plan for enhancements (multi-timeframe analysis, TradingView, task/development management via TaskMaster AI).

2. Objectives and Success Metrics
2.1 Objectives
- Increase trading discipline via pre-trade emotional check-in and structured planning
- Centralize trade data with automated ingestion from MT5, including screenshots
- Enable actionable post-trade journaling and analysis
- Provide a fast, reliable UX with streaming AI guidance (Aria)
- Maintain high security and data integrity

2.2 Success Metrics (initial)
- Emotional Check Completion Rate: ≥ 80% of trades with pre-trade check-in
- Trade ingestion reliability: ≥ 99% success rate from MT5 EA to backend
- Screenshot attachment rate: ≥ 90% of closed trades with a screenshot link
- Journal adherence: ≥ 70% of completed trades have at least one post-trade note
- Time-to-first-token (SSE): ≤ 1.5s p95 following initial connect in dev
- Error rate: ≤ 1% 4xx/5xx on core endpoints (trading session)

3. Scope
3.1 In-Scope (now)
- Emotional check flow with AI persona (Aria), SSE streaming, and today-trades context infusions
- Trade Plans lifecycle (open → emotional_check → decisions)
- MT5 Trade Logs ingestion (real-time), querying, filtering, and pagination
- Google Drive screenshot storage and link management
- Journal History browsing for completed plans
- Secure OAuth via Google + JWT, route guards, Joi validation

3.2 Near-Term In-Scope (roadmap)
- Multi-timeframe analysis workflow (e.g., M15/H1/H4) with guided steps
- TradingView integration for chart snapshots and plan annotations
- Better post-trade analytics (streaks, equity curve overlays, tags)
- Security hardening: httpOnly cookies, basic rate limiting, CSRF tokens
- TaskMaster AI for development management and project coordination

3.3 Out-of-Scope (for this phase)
- Direct brokerage execution
- Real-time market data feeds within the app
- Multi-user collaboration (beyond single account)
- Native mobile clients

4. Users and Personas
- Primary Persona: Individual discretionary trader seeking improved emotional discipline and structured workflows. Goals: reduce impulsive trades, improve consistency, capture context-rich journal entries, and review performance.
- Secondary Persona (future): Mentor/coach view or multi-trader admin, used to analyze multiple accounts (not in current scope).

5. Current State Summary (as of 2025-11-27)
- Frontend: Vue 3 + Vite; routes include planning, history (renamed to Journal History), logs; SSE streaming for Aria; strong UX improvements for scrolling/typing.
- Backend: Node.js/Express; Mongoose models for User, TradePlan, TradeLog, ApiKey, Configuration; robust Joi validation; auth with Google OAuth/JWT; AI service uses DeepSeek Reasoner with graceful fallbacks.
- MT5: Expert Advisor (MT5_TradeAid_EA.mq5) sends trades to backend; historical export script; Google Drive screenshot integration; ApiKey → user mapping enforces correct ownership.
- Docs: Comprehensive KNOWLEDGE_TRANSFER.md detailing architecture, security, recent changes, and known issues.

6. Functional Requirements
6.1 Authentication and Authorization
- Google OAuth with JWT on the client.
- Protected routes must use authenticateToken.
- Admin-only configuration actions gated by requireAdmin (ADMIN_EMAILS) where applicable.
Acceptance Criteria
- Unauthenticated access to protected routes returns 401 with consistent error body.
- JWT validation endpoint (/auth/validate) must accurately reflect status within 50ms p95 local.

6.2 Emotional Check + Aria Chat (Pre-trade)
- Start with emotional check (emotion + body signals + optional notes).
- SSE streaming for chat replies; persona “Aria” must be concise, supportive, and emotionally-focused per aiPersonality.js config.
- System-level onboarding message appears instantly when modal opens.
- today-trades context (open/completed counts; first trade of day) included in prompts.
Acceptance Criteria
- SSE connection with first token under 1.5s p95 locally, sustained stream with no premature termination.
- Emotion and body signals properly sanitized (intensity clamped 1–10; empty signals filtered).
- Clear separation: No technical/trading setup advice during emotional phase.

6.3 Trade Plan Lifecycle
- Create new trade plan (default status: open); transitions: emotional_check → decisions (entered, passed_over, cancelled, completed).
- View and continue plans via details modal (split panes: chat left, details right).
- Delete plan with confirmation; update UI optimistically.
Acceptance Criteria
- Status changes persist and reflect in UI immediately.
- Details modal shows full conversation and emotional state accurately.

6.4 Trade Logs (MT5 Ingestion + Query)
- Backend accepts POST /api/trade-logs from MT5 EA, maps apiKey → userId; dev fallback can be disabled via NODE_ENV=production.
- GET /api/trade-logs with filtering (symbol, status, date range) + sort + pagination; JWT required.
- Context endpoint returns today/yesterday trades for prompt infusion.
- Screenshots stored to Google Drive with file link persisted.
Acceptance Criteria
- New trades from EA appear in /logs for the owning user within seconds.
- Pagination metadata reflects accurate totals, pages, and limits.
- Screenshot upload returns a public link (or safe link) and is visible in table.

6.5 Journal History
- View completed trades with summaries and access to details modal.
- Provide navigation to Trade Logs and planning flows.
Acceptance Criteria
- “Journal History” label used consistently in navbar and headings.
- Completed trades filter and display reliably from backend.

6.6 Configurations
- Fetch assets, timeframe collections, emotions, and body signals from /api/config; fallback defaults if unreachable (dev).
- Admin endpoints (where applicable) protected by requireAdmin (except asset add now only requires authentication as per latest change).
Acceptance Criteria
- UI loads configuration from API under 200ms p95 locally.
- Fallback defaults only apply when API unreachable; UX communicates limited state if needed.

7. Non-Functional Requirements
7.1 Security
- Input validation on all public endpoints via Joi.
- No secrets in source; use environment variables.
- Move JWT to httpOnly cookies (roadmap), add rate limiting to auth/AI endpoints, add CSRF protection for state-changing routes.
7.2 Performance
- Backend response time for GET /api/trade-logs: p95 ≤ 300ms (local dev, paginated 25).
- SSE streaming must handle intermittent network delays with retry logic on frontend.
7.3 Reliability
- MT5 ingestion retries on EA side; backend resilient to duplicate ticket ingestion (idempotency by mt5Ticket).
- Graceful fallback when AI provider unavailable; still respond with supportive message (implemented).
7.4 Observability
- Backend logs gated by DEBUG/NODE_ENV.
- Capture key events: trade ingested, screenshot upload, emotional check submitted, SSE start/end.

8. Technical Architecture
8.1 Frontend
- Vue 3 Composition API, Pinia, Vite.
- Routes: /planning, /history (Journal History), /logs, /login.
- SSE streaming for chat; proper scroll behavior; min-height: 0 on flex/grid containers to enable inner scrolling.
8.2 Backend
- Express 4; Mongoose models: User, TradePlan, TradeLog, ApiKey, Configuration.
- Routes:
  - Auth: /auth/*
  - Trade Plans: /api/trade-plans (CRUD, chat/stream, today-trades, etc.)
  - Trade Logs: /api/trade-logs (POST ingest, GET query, /context, /:id/screenshot)
  - Configurations: /api/config/*
- Services: aiService (DeepSeek Reasoner), googleDriveService (Drive uploads)
8.3 Data Models (high level)
- TradePlan: emotionalState { state, bodySignals[], notes }, status, decision, conversation[]
- TradeLog: MT5 fields (ticket, symbol, direction, lot size, prices, timestamps), account balances, screenshotUrl
- ApiKey: apiKey → user mapping for EA posts
8.4 Environment Variables (selected)
- Backend: MONGODB_URI, PORT, FRONTEND_URL, GOOGLE_CLIENT_ID/SECRET, JWT_SECRET, DEEPSEEK_API_KEY, MT5_API_KEY, DEFAULT_USER_ID, GOOGLE_DRIVE_FOLDER_ID, GOOGLE_SERVICE_ACCOUNT_KEY_PATH, ADMIN_EMAILS, NODE_ENV, DEBUG
- Frontend: VITE_API_BASE_URL

9. Integrations
9.1 MT5 EA
- MT5_TradeAid_EA.mq5 posts trade lifecycle events to backend with apiKey.
- Historical export script for initial import.
- Test harness: test-mt5-integration.js
9.2 Google Drive
- backend/src/services/googleDriveService.js; uploads screenshots and returns sharable link or accessible URL.
9.3 TaskMaster AI (Development Management)
- Use TaskMaster AI to manage TradingAid2 development (not user-facing integration in-app at this time).
- Setup: install TaskMaster, create TradingAid project, import current roadmap, manage dependencies and milestones.

10. Roadmap and Milestones
M1 (Completed): MT5 ingestion + Trade Logs page + ApiKey mapping + SSE stability + UX fixes
- Definition of Done: trade appears in /logs for correct user; SSE chat consistent; docs updated.
M2 (2–3 weeks): Security hardening (httpOnly JWT migration plan, rate limiting, CSRF) + Analytics hooks
- DoD: Auth on cookies behind feature flag; minimal rate limit for auth + AI routes; CSRF token for mutating endpoints; analytics event hooks.
M3 (3–4 weeks): Multi-timeframe Analysis Workflow
- DoD: UI flow for timeframe sequence, progress steps, dependency prompts, persistence to TradePlan extension; guided context prompts.
M4 (4–6 weeks): TradingView Integration (research, PoC, capture chart snapshots + annotations)
- DoD: Import annotated snapshots into plan/journal; link to specific trades/plans.
M5 (ongoing): Post-Trade Analytics Enhancements (streaks, tags, filters)
- DoD: Journal views enriched; new filters; CSV export; charts.
Dependencies and sequencing managed with TaskMaster AI.

11. Acceptance Criteria (selected highlights)
- MT5 trade ingested: POST /api/trade-logs returns 201 with id and mapped userId; entry visible on /logs for logged-in owner.
- Screenshot upload: POST /api/trade-logs/:id/screenshot returns URL; table shows clickable link.
- Emotional check-in: submit payload with sanitized bodySignals; SSE returns streaming assistant response within 1.5s p95 to first token in dev.
- Journal History: Completed statuses are listed with stable navigation; details modal accessible; no residual “Active Trades” route errors.
- Security: All mutating routes validated via Joi; admin routes properly protected; no sensitive logs in production.

12. Risks and Mitigations
- Risk: API key leakage from EA config → Mitigation: rotation + mapping reseed; disable dev fallback in production.
- Risk: SSE instability on slow networks → Mitigation: retry/backoff; bundled /chat fallback in place.
- Risk: OAuth misconfiguration → Mitigation: strict redirect URIs; validation schema for callback codes.
- Risk: Data drift between TradePlan and TradeLog → Mitigation: consistent linkages; scheduled data integrity checks.

13. Open Questions
- Will we migrate JWT to httpOnly cookies now or phase it with the rate limiting work?
- For Google Drive, do we need domain-restricted sharing or public links are acceptable for solo use?
- What TradingView integration path (official APIs, widgets, or manual capture) do we prefer?

14. Implementation Notes and References
- See docs/KNOWLEDGE_TRANSFER.md for detailed changelog and technical notes.
- MT5 onboarding and environment: MT5_SETUP_GUIDE.md, backend/.env.example.
- Seeding scripts: backend/src/utils/seedConfigurations.js, backend/src/utils/seedApiKey.js
- Trade Logs API: backend/src/routes/tradeLogs.js; model at backend/src/models/TradeLog.js
- Emotional check/chat: backend/src/services/aiService.js; frontend/src/components/NewTradePlanModal.vue

15. Tooling and Process
- Development Management: TaskMaster AI (self-hosted), used to break down features and manage dependencies across frontend, backend, and AI workstreams.
- Git Hygiene: Conventional commits; pair documentation updates in the same commit with implementation when directly related; for planning PRDs, stand-alone docs commit is acceptable.
- Documentation Gate (enforced practice): Update docs before committing related code changes; include both in the same commit; push to origin; verify history.

Appendix A: Initial Backlog (High-Level)
- Security
  - httpOnly cookies migration path
  - Rate limiting on /auth, /api/trade-plans/chat*, /api/trade-logs
  - CSRF for mutating routes
- Analytics
  - Client event hooks: emotional check start/complete, SSE timing, trade ingestion view
  - Server logging for 4xx/5xx centralization
- Multi-timeframe Analysis
  - UI flow design and state model
  - Persistence model updates (new subdocument/fields on TradePlan)
  - Guided prompt templates
- TradingView Integration
  - Feasibility assessment
  - MVP capture + annotate → link to plan/logs
- Journal Enhancements
  - Tags/filters/search
  - CSV export and Drive backup
- MT5 Enhancements
  - Per-account ApiKeys
  - Optional webhook signatures
