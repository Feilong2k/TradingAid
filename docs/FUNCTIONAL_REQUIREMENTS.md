# TradingAid2 – Functional Requirements (Concise)

## 1) Authentication & Authorization
- Google OAuth 2.0 login; issue JWT on success.
- Protected API routes require valid JWT (401 on missing/invalid token).
- Route guards on frontend redirect unauthenticated users to /login.

## 2) Trade Planning & Emotional Check
- Create Trade Plan with default status: open.
- Start Emotional Check: capture emotion, body signals (signal + intensity 1–10), optional notes.
- Sanitize payload: filter empty signals; clamp intensity to 1–10.
- Transition status through emotional_check → decision (entered, passed_over, cancelled, completed).
- Delete plan with confirmation and optimistic UI update.

## 3) Aria Chat (SSE Streaming)
- Stream AI responses over SSE for Emotional Check and plan-related chat.
- Show instant system onboarding message on modal open.
- Switch indicators from “thinking” to “typing” on first token; auto-scroll chat.
- Provide bundled non-stream fallback on SSE failure.

## 4) MT5 Trade Logs Ingestion
- POST /api/trade-logs accepts real-time trades from MT5 EA.
- Resolve user: JWT userId OR ApiKey mapping (apiKey→userId). Dev fallback disabled in production.
- Persist trade data including ticket, symbol, direction, lot, prices, timestamps, account balances.

## 5) Trade Logs Query & Context
- GET /api/trade-logs supports filters (symbol, status), date range, sort (openTime/closeTime/profit/symbol), and pagination.
- GET /api/trade-logs/context returns today/yesterday summaries for AI prompts.
- Require Authorization header for GET endpoints.

## 6) Screenshots Integration
- POST /api/trade-logs/:id/screenshot uploads image to Google Drive and stores returned URL.
- Display screenshot link in Trade Logs table when present.

## 7) Journal History
- View completed trade plans with summaries.
- Open Trade Plan Details Modal to review plan, emotional state, and chat history.
- Navigation provides direct access to Trade Logs and planning.

## 8) Configurations
- Client fetches assets, timeframe collections, emotions, and body signals from /api/config.
- Fallback defaults used only when API is unreachable in development.

## 9) Admin & Security Controls
- Validation via Joi on all public-facing endpoints with consistent error messages.
- Admin-only routes guarded by requireAdmin (configured via ADMIN_EMAILS). Asset add currently auth-only per latest change.
- No secrets in source; use environment variables.

## 10) Frontend UX Requirements
- Immediate visible scrollbars where content can overflow; inner containers scroll (min-height: 0 on flex/grid parents).
- Routes: /planning, /history (Journal History), /logs, /login.
- Use VITE_API_BASE_URL with dev/prod fallback for API calls.

## 11) Reliability & Error Handling
- Idempotency guard for ingesting duplicate MT5 tickets.
- Graceful AI fallback responses when provider unavailable—no 500s for chat failures.
- Clear authorization errors (401) surfaced in UI with redirect to /login when needed.

## 12) Observability (Functional Behavior)
- Gate logs by NODE_ENV/DEBUG.
- Log key events: trade ingested, screenshot uploaded, emotional check submitted, SSE start/end.
