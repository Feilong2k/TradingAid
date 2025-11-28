# TradingAid2 – Functional Requirements (Comprehensive, PRD-Aligned)

This document consolidates functional requirements derived from the current implementation and PRD_TradingAid2, organized by domain with acceptance criteria where applicable.

Status legend:
- Implemented: Delivered and in use
- Partial: Core exists; enhancements planned
- Planned: Not yet built

## 1) Authentication & Authorization
Status: Implemented
- Google OAuth 2.0 login flow; issue JWT on success.
- Protected API routes require valid JWT; return 401 with consistent error body on missing/invalid token.
- Frontend route guards redirect unauthenticated users to `/login`.
- Admin-only actions guarded by `requireAdmin` (email allow-list via `ADMIN_EMAILS`).
- Token validation endpoint `/auth/validate` returns status quickly (target ≤ 50ms p95 local).
Acceptance Criteria
- Unauthenticated requests to protected endpoints return 401 with `{ error: 'Access token required' }`.
- Successful OAuth login stores token client-side and navigates to `/planning`.

## 2) Configurations (Assets, Timeframes, Emotions, Body Signals)
Status: Implemented
- Client fetches configurations from `/api/config` on app load/entry to planning.
- Fallback defaults used only if API is unreachable in development; surface limited state gracefully.
- Asset add route requires authentication (not admin) per latest change.
Acceptance Criteria
- Config payloads (assets, timeframe collections {label, timeframes[], description}, emotions, body signals) load under 200ms p95 locally.
- UI visibly reflects API-loaded values; in fallback, displays clear notice of limited defaults.

## 3) Trade Planning & Emotional Check
Status: Implemented
- Create Trade Plan with default status `open`.
- Emotional Check:
  - Capture emotion, body signals (signal + intensity 1–10), optional notes.
  - Sanitize payload: filter empty signals; clamp intensity to [1..10].
  - Inject “today-trades” context into prompts (first trade of day, open/completed counts).
- Status transitions: `open` → `emotional_check` → decision (`entered`, `passed_over`, `cancelled`, `completed`).
- Delete plan requires confirmation; optimistic UI removal and backend deletion.
Acceptance Criteria
- New plans appear immediately in Current Plans.
- Emotional-state PATCHes accept sanitized payloads without 400 validation errors.
- Details modal accurately reflects plan data and chat history; status changes persist and reflect in UI.

## 4) Aria Chat (SSE Streaming)
Status: Implemented
- Provide SSE streaming for emotional phase and plan-related chat.
- On modal open, show instant local system onboarding message.
- Transition UI indicators from “thinking” to “typing” on first token; auto-scroll chat as content streams.
- Provide bundled non-stream fallback if SSE fails or times out.
Performance Targets
- Time-to-first-token ≤ 1.5s p95 locally; stable stream with no premature termination.

## 5) MT5 Trade Logs – Ingestion
Status: Implemented
- Endpoint: `POST /api/trade-logs` accepts real-time trades from MT5 EA.
- User resolution order:
  1) JWT userId (if present),
  2) ApiKey mapping (apiKey → userId) via `ApiKey` collection,
  3) Dev-only fallback (disable in production).
- Persist key MT5 fields (ticket, symbol, direction, lot size, entry/exit prices, timestamps), account balances, and metadata.
- Idempotency: protect against duplicate insert by `mt5Ticket` where applicable.
Acceptance Criteria
- Valid posts return 201 with `{ id, mt5Ticket, screenshotUrl }` (screenshot may be null).
- In production, dev fallback is disabled; only ApiKey mappings and JWT user binding are accepted.

## 6) MT5 Trade Logs – Query & Context
Status: Implemented
- Endpoint: `GET /api/trade-logs` requires Authorization header; supports:
  - Filters: symbol, status (open/closed)
  - Date range: startDate/endDate
  - Sorting: openTime/closeTime/profit/symbol
  - Pagination: page/limit with totals
- Endpoint: `GET /api/trade-logs/context` summarizes today/yesterday for AI prompts.
Acceptance Criteria
- Response shape: `{ tradeLogs: TradeLog[], pagination: { page, limit, total, pages } }`.
- Filters, sorting, and pagination combine correctly; counts are accurate.

## 7) Screenshot Integration (Google Drive)
Status: Implemented
- Endpoint: `POST /api/trade-logs/:id/screenshot` uploads to Google Drive folder configured via env; persist returned URL.
- Display screenshot link in Trade Logs table when available.
Acceptance Criteria
- Successful upload returns a valid link and updates the trade log document.
- Link is visible as a clickable URL in UI.

## 8) Journal History
Status: Implemented
- “Journal History” page lists completed trade plans with summaries.
- Open Trade Plan Details Modal to review plan info, emotional state, and full conversation.
- Navigation provides direct access to Trade Logs and Planning.
Acceptance Criteria
- No references to removed “Active Trades” route; navigation consistent and error-free.
- Completed plans render reliably with accurate data.

## 9) Frontend UX & Routing
Status: Implemented
- Routes: `/planning`, `/history` (Journal History), `/logs`, `/login`.
- Ensure visible scrollbars for overflowing content; inner containers must scroll (use `min-height: 0` on flex/grid parents).
- API base URL: `import.meta.env.VITE_API_BASE_URL` or fallback to `http://localhost:3000` in dev, `https://tradingaid.onrender.com` in prod.
Acceptance Criteria
- Scroll behavior consistent across modals and split panes.
- All routes functional; unauthorized access redirects to `/login`.

## 10) Validation, Security & Admin Controls
Status: Partial (Implemented baseline; Planned hardening)
- Joi validation for all public endpoints (consistent error messages; strip unknown fields).
- Admin routes protected by `requireAdmin` where applicable; asset add is auth-only per change.
- No secrets committed to source; use environment variables across backend and frontend.
Roadmap Security Items (to be enforced incrementally)
- Move JWT to httpOnly cookies.
- Rate limiting for `/auth`, AI chat endpoints, and other sensitive routes.
- CSRF protection for all mutating endpoints.

## 11) Reliability & Error Handling
Status: Partial (Implemented core; Planned stronger idempotency)
- Prevent duplicate MT5 ticket ingestion; implement idempotency checks.
- Graceful AI fallback responses when provider unavailable; avoid 500s on chat failures.
- Clear 401/403 errors surfaced to UI; frontend handles redirects appropriately.

## 12) Observability
Status: Partial (Implemented basic logging; Planned analytics events)
- Gate logs via `NODE_ENV/DEBUG`; avoid noisy logs in production.
- Emit structured logs for key lifecycle events:
  - Trade ingested
  - Screenshot uploaded
  - Emotional check submitted
  - SSE start/end
Acceptance Criteria
- Log noise is minimized in production; diagnostic info is sufficient in development.

## 13) Multi-Timeframe Analysis Workflow (Screenshots + Aria Review)
Status: Planned
- Capture and upload multi-timeframe (e.g., LTF/MTF/HTF) screenshots to a plan-specific gallery.
- User declares preliminary trading direction; Aria analyzes screenshots + user notes and produces technical assessment.
- Record each analysis step (timestamped), tied to the same Trading Plan.
Acceptance Criteria
- Each Trading Plan displays a chronological multi-timeframe analysis log with screenshots and Aria’s notes.
- Aria responses reference specific screenshots and timeframe context.

## 14) Entry Trigger Checklist & Risk Controls
Status: Planned
- Provide an entry trigger checklist to determine entry price, stop loss, and position size.
- Enforce position sizing rules with configurable risk per trade.
- Persist the checklist and computed values on the Trading Plan.
Acceptance Criteria
- Checklist completion persists final entry/SL/size; computed risk matches configuration; edits are versioned or tracked.

## 15) Ongoing Intratrade Analysis & Emotional Check-ins
Status: Planned
- Allow multiple ongoing analyses on lower and medium TF during trade lifecycle; each entry timestamped and attached to the plan.
- Insert periodic emotional check-ins during trade to capture state changes and coping actions.
Acceptance Criteria
- Plan timeline shows alternating technical/emotional entries; entries are filterable by type/timeframe; Aria provides situational support.

## 16) Automatic Linking of Executed Trades to Plans
Status: Planned
- When an execution occurs (via MT5 ingestion), link the TradeLog to its Trading Plan automatically (match by plan ID, ticket, or association).
- All plan-related screenshots are viewable alongside related TradeLog(s).
Acceptance Criteria
- Executed trades appear within the plan under “Executions” with ticket, fills, P/L; screenshot gallery remains accessible from both plan and log.

## 17) Post-Trade Review
Status: Planned
- Provide a structured review template (what worked, deviations, emotion management, lessons, next actions).
- Aria summarizes key insights and suggests improvements.
Acceptance Criteria
- Completed trades include a Review section; Aria’s summary references plan data, logs, and emotional entries.

## 18) TradingView Integration (Charts & Data)
Status: Planned
- Integrate TradingView charts for in-app analysis (embed or API), including annotated snapshots attached to a plan.
- Persist annotations and link to timestamps/trade stages.
Acceptance Criteria
- Users can open a chart within the app, create annotations, and save snapshots that appear in the plan’s gallery.

## 19) In-App Trade Placement
Status: Planned
- Enable order placement from within the app based on entry checklist (broker integration TBD).
- Capture execution feedback and reconcile with Trade Logs.
Acceptance Criteria
- Orders initiated in-app are confirmed with broker feedback and reflected in plan/trade logs.

## 20) Aria Longitudinal Coaching & Learning
Status: Planned
- Aria reviews historical trades/plans to provide habit insights and technical improvement advice.
- Over time, Aria adapts/learns TA preferences and improves prompt chains and analysis.
Acceptance Criteria
- “Insights” view aggregates patterns (e.g., entry discipline, stop placement, emotional triggers), with actionable suggestions and tracking of follow-ups.

---

## Recommended Additions (to make this document more complete)

- Roles & Permissions (RBAC)
  - Define future roles (user, admin) scopes and actions explicitly.
  - Acceptance tests for unauthorized action attempts and audit of permission checks.

- Rate Limits & Quotas (Functional Behavior)
  - Specify per-endpoint/requester limits (e.g., 60 req/min on /auth, 10 streams/min per user on chat).
  - Define error behavior and retry headers (429 with Retry-After).

- Error Message Catalog
  - Centralize user-facing error codes/messages for common failures (auth, validation, upload, AI timeout).

- Accessibility (A11y)
  - Target WCAG 2.1 AA for core flows (keyboard navigation, ARIA landmarks, color contrast).
  - Define acceptance checks for modals, focus traps, readable error states.

- Internationalization (i18n) Readiness
  - Externalize UI strings; document locale strategy even if English-only initially.

- Data Retention & Backup
  - Define retention periods for logs, screenshots, and plan data; backup/restore expectations.

- Audit Logging
  - Record critical actions (login, plan delete, config changes), including who/when/what, for traceability.

- Analytics Events
  - Instrument key product metrics (emotional check start/complete, SSE timings, plan lifecycle transitions).
  - Define event schema and privacy-safe parameters.

- Import/Export
  - CSV/JSON export for journal and logs; documented import constraints and validation (beyond current historical import).

- Notifications/Reminders (Roadmap)
  - Optional reminders for pre-trade check, post-trade journaling; channel strategy (in-app vs external).

- Feature Flags
  - Enable gradual rollout for security changes (httpOnly cookies), new flows (multi-timeframe analysis), and AI tuning.

- Environment Matrix
  - Document config per environment (dev, staging, prod), including VITE_API_BASE_URL, OAuth redirect URIs, folder IDs.

- Acceptance Test Scenarios
  - List end-to-end test cases with expected outcomes (auth flow, plan creation → emotional check → chat stream → decision; MT5 ingest → logs page with screenshot).

- Privacy & Compliance
  - Note PII handling (email, name), screenshot content considerations, and consent if needed.

These additions will strengthen the functional specification, improve reliability and maintainability, and prepare the product for future scale.
