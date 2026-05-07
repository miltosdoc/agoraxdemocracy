<div align="center">
  <h1>AgoraX — Digital Democracy Platform</h1>
  <p>Participatory deliberation &amp; voting for Greek communities</p>
  <p><strong>Powered by the Demopolis working group specifications</strong></p>
</div>

---

AgoraX is a digital democracy platform built for Greek citizens to participate in transparent, reliable deliberation and voting processes. The platform implements the **Demopolis** deliberation framework — a structured pipeline of proposal submission, LLM-assisted validation, sortition-based citizen jury evaluation, threaded debate, amendments, and final community voting.

**Built by the Demopolis working group.** All deliberation mechanics, governance models, and procedural specifications come from the Demopolis design documents.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  React + Vite + Wouter Router + shadcn/ui + Tailwind CSS     │
│  AppShell layout · LifecycleStepper · i18n (el/en)           │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/JSON (proxied via Vite)
┌──────────────────────────▼──────────────────────────────────┐
│                         Backend                              │
│  Express.js Routes → Storage Layer (IStorage) → Drizzle ORM │
│                                                              │
│  80+ API endpoints · 79+ storage methods · Job Queue        │
│  LLM Validation · Sortition · TF-IDF Amendments · Debate    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      PostgreSQL                              │
│  24 tables · Users · Communities · Proposals · Sortition    │
│  Amendments · Debate · Ballot Verification · Notifications   │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend:** React + Vite, Wouter (routing), shadcn/ui, Tailwind CSS, Leaflet (maps), TipTap (rich text)
- **Backend:** Express.js, Node.js 20
- **Database:** PostgreSQL 15 with Drizzle ORM
- **Authentication:** Sessions + cookies (PostgreSQL-backed), Google OAuth, Gov.gr ballot verification
- **LLM Validation:** Configurable (NVIDIA Nemotron free tier, OpenRouter, Anthropic, local Ollama)
- **Internationalization:** Greek (default) + English with runtime switching, locale-aware date formatting
- **Notifications:** Sortition assignment alerts, deadline reminders, proposal lifecycle events, per-user preferences
- **Image Generation:** Canvas (Node.js) for Open Graph social preview images
- **Deployment:** Docker Compose (PostgreSQL + Node.js API + Python Ballot Service)
- **Device Fingerprinting:** FingerprintJS for one-person-one-vote enforcement

---

## Project Status

AgoraX is in **active development** with a complete backend and rapidly evolving frontend.

**Completed (Phases 1–6a):**
- TypeScript compilation clean (0 errors)
- 8-state proposal lifecycle with state machine
- LLM validation pipeline (tiered scoring: reject / sortition / auto-approve)
- Sortition system — random citizen selection, scoring, timeout handling, completion
- Amendment system with TF-IDF + cosine similarity deduplication
- Threaded debate system with upvote/downvote
- Community system — autonomous/managed split, democracy scoring
- Job queue — 6 async handlers (sortition timeout, LLM validation, notifications, etc.)
- UI: AppShell layout system, LifecycleStepper, Proposal Index, Debate Panel, Landing/Dashboard split
- UI: Proposal workspace — 5-tab detail page (Overview, Debate, Amendments, Sortition, Votes)
- UI: AmendmentsPanel — status badges, duplicate grouping, community signal, submit form
- UI: SortitionPanel — body status, member count, response rate, average score, deadline
- UI: NextActionPanel — context-aware action panel based on proposal lifecycle state
- UI: VotePanel — full voting component with progress bars, participation tracking, finalize
- UI: Platform Settings — admin settings page (General, Sortition, LLM Validation, Demo Mode)
- Attendance schema — sortitionAttendance table with status tracking
- 25 tables, 82+ API endpoints, 81+ storage methods
- 53/54 tests passing (1 pre-existing failure requiring DATABASE_URL)

**In Progress (Phase 6b):**
- Attendance tracking backend + UI
- Search & discovery
- Mobile responsiveness
- LLM validation UI
- Notifications system

---

## Demopolis Integrations

The following features are direct implementations of Demopolis specifications:

### 1. Communities (Κοινότητες)
- **Autonomous Communities** (Αυτόνομες Κοινότητες) — Horizontal governance, no admins required
- **Managed Communities** (Διαχειριζόμενες Κοινότητες) — Admin team with defined, revocable powers
- Default "General" community auto-enrolls all new users
- Per-community deliberation parameters (sortition size, minimum participation, concurrent vote limits)
- Democracy score — computed metric showing how democratic the community governance is
- Platform settings stored as governance proposals

### 2. Proposals (Προβουλεύματα)
- **Question + Solution format** (Το Ερώτημα + Η Απάντηση/Λύση) — every proposal defines a specific action
- Full state machine: `draft → submitted → llm_validation → author_review / sortition → author_review / voting → archived`
- **LLM Tiered Validation**:
  - **<20%**: Returned to author for revision with feedback
  - **20-90%**: Sent to sortition body for human review
  - **>90%**: Auto-approved, advances to voting
- Author appeal mechanism — any LLM decision can be appealed to a sortition body
- Similar proposal detection & merge workflow (AI-assisted, author confirms)

### 3. Sortition Bodies (Κληρωτά Σώματα)
- Random citizen selection for evaluation tasks — ensures fair participation, prevents power concentration
- Configurable size (absolute number or percentage of community)
- Multiple purposes: validity checks, proposal scoring, conflict resolution, vote promotion
- Timeout handling with replacement members
- Self-exclusion option for selected members
- Scoring: 0-100 scale with optional feedback
- Completion thresholds: ≤33 → author_review, 34-100 → voting, null → archived

### 4. Amendments (Αντιπροτάσεις & Βελτιώσεις)
- **Improvements** (Βελτιώσεις): Minor text changes to existing proposals
- **Counter-proposals** (Αντιπροτάσεις): Same problem, different solution
- Original author has **veto power** over amendments (preserves proposal coherence)
- LLM validation for amendments follows same tiered logic as proposals
- AI-assisted merge of similar amendments (TF-IDF + cosine similarity)
- **Community Signal**: When author rejects an amendment, community can upvote to signal disagreement

### 5. Debate (Διάλογος)
- Threaded discussions on proposals with nested replies
- Upvote/downvote tracking per user (one vote per thread per user)
- Thread stats (total votes, reply count)
- Text, audio, or video debate formats (text implemented)

### 6. Voting (Ψηφοφορία)
- Multiple voting types: single choice, multiple choice, ranked preferences, sequential rounds
- Minimum participation threshold for validity (configurable per community)
- Secret ballot with verifiable integrity
- **Ballot voting** (Gov.gr Solemn Declaration PDF verification)

### 7. AI Assistance (Τεχνητή Νοημοσύνη)
- AI as a **support tool only** — never makes final decisions
- Uses: validity checking, similar proposal detection, organization/categorization, debate summarization
- Transparent usage — members know when AI is used
- Results can be reviewed and challenged
- Final decisions always belong to sortition bodies or the full membership

---

## Proposal Lifecycle

```
draft → submitted → llm_validation → author_review / sortition → author_review / voting → archived
```

1. **Draft** — Author creates a proposal (question + solution)
2. **Submitted** — Author submits for review
3. **LLM Validation** — LLM scores proposal structure, clarity, completeness
4. **Routing by score:**
   - **<20%** → `author_review` (returned with feedback for revision)
   - **20-90%** → `sortition` (citizen jury evaluates)
   - **>90%** → `voting` (auto-approved, goes straight to community vote)
5. **Sortition Completion:**
   - **≤33** → `author_review` (jury rejected)
   - **34-100** → `voting` (jury approved)
   - **null** → `archived` (timeout, no quorum)
6. **Voting** — Full community votes on the final proposal
7. **Archived** — Final state (ratified or rejected)

---

## Database Schema

**Core:** `users`, `communities`, `community_members`, `proposals`, `proposal_amendments`

**Deliberation:** `sortition_bodies`, `sortition_members`, `sortition_notifications`, `debate_threads`, `debate_replies`, `debate_votes`, `validation_results`

**Voting:** `proposal_votes`, `proposal_support`, `ballot_votes`, `govgr_verified`

**Governance:** `platform_settings`, `amendment_rejection_votes`, `admin_actions`

**Security:** `account_activity`, `device_fingerprint`

**Infrastructure:** `groups`, `group_members`, `jobs`, `notification_preferences`

---

## Getting Started

### Option 1: Docker Compose (Recommended)

```bash
# Clone and start
git clone https://github.com/miltosdoc/agoraxdemo.git
cd agoraxdemo

# Configure required local secrets
cp .env.example .env
# Edit .env: set POSTGRES_PASSWORD, SESSION_SECRET, JWT_SECRET, SALT_KEY.
# Keep DEMO_MODE=true only for local demo/testing.

# Start everything (PostgreSQL + API + ballot service)
docker compose up -d --build

# Check status
docker compose ps
curl http://localhost:3000/api/health

# Seed demo data (optional)
docker compose exec -T db psql -U agorax -d agorax < seed_demo.sql
```

### Option 2: Local Development

#### Prerequisites
- Node.js 20+
- PostgreSQL 15+

#### Setup

```bash
# Clone and install
git clone https://github.com/miltosdoc/agoraxdemo.git
cd agoraxdemo
npm install

# Database setup
cp .env.example .env
# Set DATABASE_URL in .env (e.g., postgresql://user:***@localhost:5432/agorax)

# Push schema to database
npm run db:push

# Seed demo data (optional)
psql -d agorax -f seed_demo.sql

# Start development server
npm run dev
```

### Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (**required**)
- `LLM_API_KEY` — OpenRouter (or OpenAI-compatible) key for proposal validation; without a key the service returns a deterministic mock
- `LLM_MODEL` — LLM model name (default: `nvidia/nemotron-3-nano-30b-a3b:free`)
- `LLM_API_URL` — OpenAI-compatible LLM API endpoint (default: `https://openrouter.ai/api/v1`)
- `JWT_SECRET` — Secret for JWT tokens (required; use a long random value)
- `SESSION_SECRET` — Secret for session cookies (required; use a long random value)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `DEMO_MODE` — Set to `true` to bypass auth for testing
- `APP_ENV` — Application environment (`local`, `staging`, `production`); production blocks demo mode and default secrets
- `PORT` — Backend port (default: 3000)

### Demo Mode

For testing without setting up OAuth, set `DEMO_MODE=true` in `.env` and run Docker Compose or `npm run dev`.

Demo mode bypasses authentication and uses a demo user (ID: 3) for protected API requests. It is blocked when `APP_ENV=production`, so do not use it for production-like deployments.

---

## Project Structure

```
agoraxdemo/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/             # Route components (20+ pages)
│   │   ├── components/        # Reusable UI (shadcn/ui + AppShell, LifecycleStepper, DebatePanel)
│   │   ├── hooks/             # Custom React hooks (auth, translation, share, toast)
│   │   ├── lib/               # Utilities (api client, query client, proposal-status, i18n)
│   │   └── App.tsx            # Router configuration
├── server/                    # Express backend
│   ├── index.ts               # Entry point + job queue startup
│   ├── routes.ts              # All API routes (2500+ lines, 80+ endpoints)
│   ├── storage.ts             # IStorage interface + DatabaseStorage (79+ methods)
│   ├── auth.ts                # Authentication (sessions, OAuth, Gov.gr)
│   ├── db.ts                  # Drizzle connection
│   ├── seed-demo.ts           # Demo data seeder
│   └── utils/                 # Domain logic
│       ├── llm-validation.ts  # LLM proposal validation
│       ├── proposal-state-machine.ts  # 8-state lifecycle transitions
│       ├── amendment-processor.ts     # Amendment workflow
│       ├── amendment-similarity.ts    # TF-IDF + cosine similarity
│       ├── sortition.ts             # Random citizen selection
│       ├── sortition-scheduler.ts    # Timeout sweep + replacement
│       ├── debate.ts                # Threaded debate logic
│       ├── community-manager.ts     # Community CRUD + auto-enrollment
│       ├── notifications.ts        # Sortition notification system
│       ├── democracy-score.ts       # Community governance score
│       ├── job-queue.ts             # Background job processing
│       ├── job-handlers.ts          # 6 registered job handlers
│       ├── ballot-client.ts         # Gov.gr ballot verification
│       └── geo-region-detector.ts   # Location detection
├── shared/
│   └── schema.ts              # Drizzle schema (928 lines, 24 tables)
├── ballot_service/            # Python ballot verification (FastAPI + pyhanko)
├── migrations/                # SQL migrations
├── Dockerfile                 # Multi-stage build (Node 20 + canvas)
├── docker-compose.yml         # PostgreSQL + API services
├── drizzle.config.ts          # Drizzle ORM configuration
├── seed_demo.sql              # Demo data seed script
├── start.sh                   # Production-style starter for an already-built app
└── README.md                  # This file
```

---

## API Endpoints

### Health
- `GET /api/health` — Service health check (database connectivity)
- `GET /api/ballot/health` — Ballot service health check

### Proposals
- `GET /api/proposals` — List all proposals (filters: status, community, search, sort)
- `GET /api/proposals/:id` — Get proposal details
- `POST /api/proposals` — Create a new proposal
- `POST /api/proposals/:id/submit` — Submit for LLM validation
- `GET /api/proposals/:id/support` — Get support/oppose counts
- `POST /api/proposals/:id/support` — Cast support/oppose vote
- `POST /api/proposals/:id/transition` — Transition proposal state

### Amendments
- `GET /api/proposals/:id/amendments` — List amendments for a proposal
- `POST /api/proposals/:id/amendments` — Create an amendment
- `POST /api/amendments/:id/review` — Author accepts/rejects amendment
- `POST /api/amendments/:id/rejection-vote` — Community votes on rejected amendment
- `GET /api/proposals/:id/amendments/signals` — Get community signal data
- `GET /api/proposals/:id/sortition-input` — Get sortition synthesis input
- `POST /api/proposals/:id/final-text` — Submit sortition-synthesized text

### Debate
- `GET /api/proposals/:id/debate/threads` — List debate threads
- `POST /api/proposals/:id/debate/threads` — Create a debate thread
- `POST /api/debate/threads/:id/replies` — Add a reply
- `POST /api/debate/threads/:id/upvote` / `downvote` — Vote on thread
- `GET /api/debate/threads/:id/stats` — Thread statistics

### Sortition
- `POST /api/communities/:id/sortition` — Create sortition body (admin/founder)
- `GET /api/communities/:id/sortition/preview` — Preview sortition selection
- `GET /api/communities/:id/sortition` — List all sortition bodies (admin/founder)
- `GET /api/sortition/:bodyId` — Get sortition body with members
- `POST /api/sortition/:bodyId/complete` — Complete a sortition body
- `POST /api/sortition/:bodyId/synthesize` — Aggregate scores and auto-complete
- `GET /api/sortition/assignments/:id` — Get sortition assignment
- `POST /api/sortition/assignments/:id/score` — Submit sortition score (0-100 + feedback)

### Communities
- `GET /api/communities` — List all communities
- `GET /api/communities/:id` — Get community details
- `POST /api/communities` — Create a community
- `GET /api/communities/:id/democracy-score` — Get democracy score

### Polls & Voting
- `GET /api/polls` — List polls with filters (category, location, pagination)
- `GET /api/polls/:id` — Get poll details
- `POST /api/polls` — Create a poll
- `PATCH /api/polls/:id` — Update a poll
- `DELETE /api/polls/:id` — Delete a poll (max 100 participants)
- `PATCH /api/polls/:id/community` — Transfer poll to community (hides creator)
- `POST /api/polls/:id/votes` — Cast a vote
- `GET /api/polls/:id/results` — Get poll results

### Ballot Verification (Gov.gr)
- `POST /api/ballot/validate` — Validate Solemn Declaration PDF (4-gate verification)
- `POST /api/ballot/validate-identity` — Verify identity only (one-time Gov.gr check)
- `POST /api/ballot/token` — Generate poll token for ballot voting
- `GET /api/ballot/instructions` — Get ballot voting instructions
- `GET /api/ballot/stats/:pollId` — Get ballot voting statistics

### Notifications
- `GET /api/sortition-notifications` — List user's notifications (with unread count)
- `GET /api/sortition-notifications/unread-count` — Lightweight unread count
- `POST /api/sortition-notifications/:id/read` — Mark notification as read
- `POST /api/sortition-notifications/mark-all-read` — Mark all as read
- `GET /api/notification-preferences` — Get user notification preferences
- `PATCH /api/notification-preferences` — Update notification preferences

### Social Sharing
- `GET /api/og-image/:id` — Generate Open Graph preview image for poll sharing

---

## Internationalization (i18n)

AgoraX supports **Greek (el)** as the default language and **English (en)** with runtime switching.

**How it works:**
- `I18nProvider` wraps the app, providing `useTranslation()` hook
- `t('key.subkey')` returns the translated string for the current locale
- Locale detection priority: localStorage → URL `?lang=` param → browser language → Greek default
- `LanguageSwitcher` component (🇬🇷/🇬🇧) in the header for manual switching
- date-fns locale-aware formatting (Greek/English relative times)

**Translation files:**
- `client/src/locales/en.ts` — English translations
- `client/src/locales/el.ts` — Greek translations

**Adding a new language:**
1. Create `client/src/locales/xx.ts` with the same keys
2. Add the locale to `SUPPORTED_LOCALES` in `client/src/lib/i18n-types.ts`
3. Add flag + name to `LOCALE_FLAGS` / `LOCALE_NAMES`
4. Import in `use-translation.tsx`

---

## Roadmap

The active roadmap is maintained in `.claude/ROADMAP.md`.

**Completed:** Phases 1–4 (foundation, coherence layer, core systems, UI coherence)
**In Progress:** Phase 5 (voting flow, proposal workspace, sortition experience)
**Planned:** Notifications system, search & discovery, mobile responsiveness, performance, polish

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes and test locally
4. Run the full wired suite: `npm run test:all`
5. Submit a pull request

---

## License

MIT License — Copyright (c) 2024-2026 Demopolis Working Group &amp; Miltos Triantafyllou

---

## Contact

Built by the **Demopolis working group**. For questions, contact the maintainers.
