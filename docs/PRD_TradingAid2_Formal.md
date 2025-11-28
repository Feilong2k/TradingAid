<PRD>
# TradingAid2 – Product Requirements Document

1. Introduction
TradingAid2 is a psychological trading assistant that integrates emotional discipline with structured technical workflows. This document defines the product vision, scope, and requirements for the current implementation and near‑term roadmap. It is derived from implemented system behavior and the functional requirements. The PRD guides delivery, enables test planning, and ensures traceability from user needs to shipped features.

2. Product overview
TradingAid2 helps traders plan, execute, and review trades while maintaining emotional discipline. The product combines:
- Pre‑trade emotional check‑ins and guided coaching via Aria (AI persona)
- Structured trade planning and lifecycle management
- Automated ingestion of real‑time trades from MT5, with screenshots stored in Google Drive
- Journaling and review linking plan, execution logs, and emotional context
- Roadmap capabilities for multi‑timeframe (MTF) analysis with screenshot galleries, entry trigger checklists, intratrade analysis/check‑ins, TradingView integration, in‑app orders, and Aria’s longitudinal coaching

3. Goals and objectives
3.1 Goals
- Improve trading consistency via emotional awareness and structured workflows
- Centralize and link planning, execution logs, and visual evidence (screenshots)
- Provide fast, reliable AI support (Aria) across emotional and technical phases
- Establish a scalable platform for advanced analysis and integrations

3.2 Objectives and success metrics
- ≥ 80% trades include a completed pre‑trade emotional check
- ≥ 99% successful ingestion rate from MT5 EA to backend
- ≥ 90% of closed trades include a screenshot link
- ≤ 1.5s p95 time‑to‑first‑token on SSE (dev/local)
- ≤ 1% 4xx/5xx error rate on core endpoints during trading sessions

4. Target audience
- Primary: Individual discretionary traders seeking reduced impulsive trades, improved discipline, and structured planning/review
- Secondary (future): Mentors/coaches and power users needing deeper analysis across multiple plans/traders

5. Features and requirements

5.1 Authentication and authorization

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| AU-101 | Google OAuth login | Enable sign‑in via Google OAuth; issue JWT upon success | High |
| AU-102 | Protected routes | Enforce JWT on protected API routes; return 401 on missing/invalid token | High |
| AU-103 | Route guards | Redirect unauthenticated users to /login on guarded frontend routes | High |
| AU-104 | Admin controls | Restrict admin actions using allow‑listed emails (requireAdmin) | Medium |

5.2 Configurations

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| CF-101 | Fetch configuration | Load assets, timeframe collections, emotions, body signals from /api/config | High |
| CF-102 | Dev fallbacks | Use safe defaults when API is unreachable in development | Medium |
| CF-103 | Asset management | Allow authenticated users to add assets (auth‑only per latest policy) | Medium |

5.3 Trade planning and emotional check

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| TP-101 | Create trade plan | Create plan with default status open; show in Current Plans immediately | High |
| TP-102 | Emotional check capture | Collect emotion, body signals (1–10), and notes | High |
| TP-103 | Payload sanitation | Filter empty signals; clamp intensity to [1..10] | High |
| TP-104 | Context infusion | Include “today trades” context in Aria prompts | Medium |
| TP-105 | Status transitions | Manage status transitions (open → emotional_check → entered/passed_over/cancelled/completed) | High |
| TP-106 | Delete plan | Confirm and delete plan with optimistic UI update | Medium |

5.4 Aria chat (SSE)

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| AC-101 | SSE streaming | Stream Aria responses with thinking → typing indicators; auto‑scroll chat | High |
| AC-102 | Onboarding message | Show instant local system onboarding message on modal open | Medium |
| AC-103 | Fallback handling | Provide bundled, non‑stream fallback on SSE failure without 500 | High |
| AC-104 | Performance target | First token ≤ 1.5s p95 in dev/local | High |

5.5 MT5 trade logs ingestion and query

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| TL-101 | Ingest MT5 trade | POST /api/trade-logs; resolve user via JWT → ApiKey map; disable dev fallback in prod | High |
| TL-102 | Query logs | GET /api/trade-logs with filters, sort, pagination; return pagination metadata | High |
| TL-103 | Daily context | GET /api/trade-logs/context for today/yesterday summaries | Medium |
| TL-104 | Idempotency | Prevent duplicate ticket ingestion; safe no‑op on duplicates | High |
| TL-105 | Screenshot upload | POST /api/trade-logs/:id/screenshot to Google Drive; persist and show link | High |

5.6 Journal history

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| JH-101 | Completed plans | List completed plans with summaries; open details modal | High |
| JH-102 | Navigation consistency | Use “Journal History” labels; remove legacy routes | Medium |

5.7 Validation, security, and admin (baseline + roadmap)

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| VS-101 | Joi validation | Validate all public endpoints with consistent error messages | High |
| VS-102 | Secrets via env | Use environment variables for all secrets and integration parameters | High |
| VS-201 | Cookie auth (roadmap) | Migrate JWT to httpOnly cookies | Medium |
| VS-202 | Rate limiting (roadmap) | Add rate limits to /auth and chat endpoints | Medium |
| VS-203 | CSRF (roadmap) | Add CSRF protection to mutating endpoints | Medium |

5.8 Reliability and observability

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| RO-101 | AI fallback | Provide graceful fallback responses on AI provider failures | High |
| RO-102 | Env‑gated logs | Gate logs via NODE_ENV/DEBUG; reduce noise in prod | High |
| RO-103 | Event logging | Log trade ingested, screenshot uploaded, emotional check submitted, SSE start/end | Medium |

5.9 Multi‑timeframe analysis workflow (planned)

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| MTF-101 | Multi‑entry analysis | Support multiple analysis entries per plan (LTF/MTF/HTF), each with one or more screenshots and notes | High |
| MTF-102 | Directional bias | Allow user to declare directional bias; Aria produces technical assessment | High |
| MTF-103 | Timeline view | Show chronological analysis log per plan with filters by timeframe | Medium |

5.10 Entry trigger checklist and risk controls (planned)

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| ET-101 | Entry/SL/size | Compute entry, stop loss, position size based on risk config | High |
| ET-102 | Persistence | Persist computed results to plan; enable edits with history/versioning | Medium |

5.11 Intratrade analysis and emotional check‑ins (planned)

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| IT-101 | LTF/MTF entries | Add multiple ongoing LTF/MTF technical analyses during trade | High |
| IT-102 | Emotional check‑ins | Add periodic emotional check‑ins during trade; timestamped | High |
| IT-103 | Timeline filters | Filter plan timeline by type/timeframe (technical vs emotional) | Medium |

5.12 Link executions to plans (planned)

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| LE-101 | Auto‑linking | Auto‑link MT5 executions to plan (by plan ID/ticket association) | High |
| LE-102 | Multi‑position support | Group multiple positions/executions (scale in/out) under plan; show per‑execution and aggregate P/L | High |
| LE-103 | Unified gallery | Make screenshot gallery accessible from both plan and logs | Medium |

5.13 Post‑trade review (planned)

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| PR-101 | Review template | Provide structured post‑trade review (what worked, deviations, lessons, actions) | High |
| PR-102 | Aria summary | Generate Aria summary referencing plan/log/emotional history | Medium |

5.14 TradingView integration (planned)

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| TV-101 | Embedded charts | Integrate TradingView charts for in‑app analysis | Medium |
| TV-102 | Annotated snapshots | Save annotated chart snapshots to plan gallery | Medium |

5.15 In‑app trade placement (planned)

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| TP2-101 | Order submission | Place orders from app based on entry checklist; broker API TBD | Medium |
| TP2-102 | Reconciliation | Reconcile execution feedback with logs and plan’s executions view | Medium |

5.16 Aria longitudinal coaching and learning (planned)

| Requirement ID | Requirement | Description | Priority |
|---|---|---|---|
| AL-101 | Habit insights | Provide habit insights and improvement suggestions across plans | Medium |
| AL-102 | Adaptive analysis | Improve TA prompts/outputs over time based on user patterns | Medium |

6. User stories and acceptance criteria

Authentication and secure access
- ST-101: As a user, I can sign in via Google OAuth to access protected features.
  - Acceptance: OAuth completes; JWT issued; protected routes accessible; 401 on missing/invalid token.
- ST-102: As a user, when my token expires, I am redirected to /login without losing unsaved work.
  - Acceptance: 401 triggers guard redirect; local planning state retained.
- ST-103: As an admin, I can access admin‑only actions; non‑admins receive 403.
  - Acceptance: requireAdmin validates ADMIN_EMAILS.

Database modeling
- ST-110: As the system, I persist trade plans with emotional state, decisions, conversation, and timestamps.
  - Acceptance: Schema defaults safe arrays; valid transitions only.
- ST-111: As the system, I persist MT5 trade logs with ticket uniqueness and account fields.
  - Acceptance: Duplicate ticket ingestion prevented (idempotency).
- ST-112: As the system, I link multiple executions to one plan.
  - Acceptance: Multiple tickets grouped; queries show per‑execution and aggregate P/L.

Trade planning and emotional check
- ST-201: As a user, I can create an open trade plan and proceed to emotional check.
  - Acceptance: Plan appears immediately in Current Plans.
- ST-202: As a user, I can submit sanitized emotional state (emotion, signals 1–10, notes).
  - Acceptance: Sanitization enforced; persisted successfully.
- ST-203: As a user, I can delete a plan after confirmation.
  - Acceptance: Optimistic UI removal; backend confirms deletion.

Aria chat via SSE
- ST-301: As a user, I see Aria’s responses stream in real time with typing indicators.
  - Acceptance: First token ≤ 1.5s p95; no premature termination.
- ST-302: If SSE fails, I receive a bundled non‑stream reply instead of a 500.
  - Acceptance: Fallback rendered gracefully.

MT5 ingestion, screenshots, and logs
- ST-401: As the EA, I can POST trades with an apiKey; backend maps to user and persists.
  - Acceptance: In prod, only ApiKey mapping/JWT accepted; dev fallback disabled.
- ST-402: As a user, I can filter/sort/paginate my trade logs and view summaries.
  - Acceptance: Pagination metadata accurate; filters combine correctly.
- ST-403: As a user, I can upload a trade screenshot and see a link in the table.
  - Acceptance: Link stored and visible.
- ST-404: Duplicate tickets are not double‑ingested.
  - Acceptance: Second POST handled idempotently.

Journal history and details modal
- ST-501: As a user, I can view completed plans, open details modal, and review plan/emotional/chat history.
  - Acceptance: Labels use “Journal History”; no legacy routes.

Multi‑timeframe and intratrade (planned)
- ST-601: As a user, I can add multiple analysis entries with screenshots and timeframe labels.
  - Acceptance: Timeline ordered; Aria references screenshots by context.
- ST-602: As a user, I can complete an entry trigger checklist to compute entry/SL/size.
  - Acceptance: Values persisted and editable with history.
- ST-603: As a user, I can add LTF/MTF intratrade analyses and periodic emotional check‑ins.
  - Acceptance: Timeline filters by type/timeframe; Aria support provided.
- ST-604: As a system, I auto‑link executions to the correct plan and group multiple positions.
  - Acceptance: Executions visible under plan; logs reference plan.
- ST-605: If an execution lacks a plan link, I can manually associate it in the UI.
  - Acceptance: Association reflects across plan and log views.

Post‑trade and coaching (planned)
- ST-701: As a user, I can complete a structured post‑trade review and receive Aria’s summary.
  - Acceptance: Review saved; Aria references plan/log/emotional entries.
- ST-702: As a user, I can view insights with habits and recommendations.
  - Acceptance: Insights aggregate across plans with actionable advice.

TradingView and orders (planned)
- ST-801: As a user, I can open TradingView charts, annotate, and save snapshots to the plan gallery.
  - Acceptance: Snapshots appear in gallery with metadata.
- ST-802: As a user, I can submit orders from the app based on the checklist; logs reconcile execution.
  - Acceptance: Order confirmation received; execution recorded and linked.

7. Technical requirements / stack

7.1 Current stack (implemented)
- Frontend: Vue 3.5.x, Vite 6.4.x, @vitejs/plugin-vue 5.x, Pinia 3.x, Vue Router 4.6.x
- Backend: Node.js (20.x verified; 24.x supported), Express 4.18.x, Mongoose 7.5.x, Joi 18.x, JSON Web Token 9.x, dotenv 16.x, axios 1.13.x, googleapis 166.x
- Storage: MongoDB Atlas (Mongoose ODM)
- Integrations: Google OAuth 2.0, Google Drive API (screenshots), MT5 EA via HTTP POST, DeepSeek Reasoner (AI)
- Tooling/hosting: Nodemon 3.x, Vite dev server, Netlify (frontend), Render (backend)
- Environment variables (selected): MONGODB_URI, PORT, FRONTEND_URL, GOOGLE_CLIENT_ID/SECRET, JWT_SECRET, DEEPSEEK_API_KEY, MT5_API_KEY, DEFAULT_USER_ID, GOOGLE_DRIVE_FOLDER_ID, GOOGLE_SERVICE_ACCOUNT_KEY_PATH, ADMIN_EMAILS, NODE_ENV, DEBUG, VITE_API_BASE_URL

7.2 Security and reliability (baseline + roadmap)
- Baseline: Joi validation, auth guards, env‑based secrets, SSE fallback, idempotent ingestion
- Roadmap: httpOnly cookie auth, rate limits for /auth and chat, CSRF for mutating endpoints, analytics eventing, granular audit logging

7.3 Performance targets
- ≤ 1.5s p95 time‑to‑first‑token on SSE (dev/local)
- ≤ 300ms p95 for GET /api/trade-logs (paginated 25/page) in dev/local
- Robust pagination for larger data sets

8. Design and user interface

8.1 Navigation and routes
- /planning: Create plan; emotional check; proceed through statuses
- /history: Journal history with completed plans; open details modal
- /logs: Trades ingested from MT5; filter/sort/paginate; screenshot links
- /login: Auth entry

8.2 Modals and layouts
- Trade plan details modal with split‑pane layout: chat (left), details (right)
- Emotional check modal: ensure inner scrolling (min‑height: 0 on flex/grid parents)
- Always‑visible scrollbars where content overflows; natural auto‑scroll during streaming

8.3 Media and galleries
- Screenshot upload and viewing in logs
- Roadmap: plan‑specific gallery for multi‑timeframe and annotated chart snapshots

8.4 Accessibility and consistency (baseline)
- Clear labels and headings; route guard messaging on auth errors
- Roadmap: keyboard access, focus traps, ARIA roles, contrast targets (WCAG 2.1 AA)

Appendix: requirement ID index
- Authentication: ST‑101..ST‑103
- Database modeling: ST‑110..ST‑112
- Planning/emotional check: ST‑201..ST‑203
- Aria SSE: ST‑301..ST‑302
- MT5 ingestion/logs: ST‑401..ST‑404
- Journal/history: ST‑501
- MTF and intratrade: ST‑601..ST‑605
- Post‑trade/insights: ST‑701..ST‑702
- TradingView/orders: ST‑801..ST‑802
</PRD>
