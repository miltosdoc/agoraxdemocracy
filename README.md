<div align="center">
  <h1>AgoraX — Digital Democracy Platform</h1>
  <p>Participatory deliberation &amp; voting for Greek communities</p>
  <p><strong>Powered by the Demopolis working group specifications</strong></p>
</div>

---

AgoraX is a digital democracy platform built for Greek citizens to participate in transparent, reliable deliberation and voting processes. The platform implements the **Demopolis** deliberation framework — a structured pipeline of proposal submission, LLM-assisted validation, sortition-based evaluation, debate, and final voting — combined with modern web technologies.

**Built by the Demopolis working group.** All deliberation mechanics, governance models, and procedural specifications come from the Demopolis design documents maintained by the working group.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  React + Vite + Wouter Router + shadcn/ui + Tailwind CSS     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/JSON (proxied via Vite)
┌──────────────────────────▼──────────────────────────────────┐
│                         Backend                              │
│  Express.js Routes → Storage Layer (IStorage) → Drizzle ORM │
│                                                              │
│  Routes: polls, surveys, groups, communities, proposals,     │
│          sortition, amendments, debate, ballot verification  │
│                                                              │
│  Features: OG image generation (canvas), social bot SEO,     │
│            health checks, demo mode, job queue               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      PostgreSQL                              │
│  Tables: users, polls, communities, proposals,               │
│          sortition_bodies, amendments, debate_arguments,     │
│          ballot_votes, jobs, admin_actions, account_activity │
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

## Demopolis Integrations

The following features are direct implementations of Demopolis specifications:

### 1. Communities (Κοινότητες)
- **Autonomous Communities** (Αυτόνομες Κοινότητες) — Horizontal governance, no admins required
- **Managed Communities** (Διαχειριζόμενες Κοινότητες) — Admin team with defined, revocable powers
- **Hybrid Model** (Υβριδικό Μοντέλο) — Member-driven with administrative guidance
- Per-community deliberation parameters (sortition size, minimum participation, concurrent vote limits)
- Democracy score — computed metric showing how democratic the community governance is
- Admin rights restrictions: admins cannot delete content published by other members

### 2. Proposals (Προβουλεύματα)
- **Question + Solution format** (Το Ερώτημα + Η Απάντηση/Λύση) — every proposal defines a specific action
- Full state machine: `submitted → validating → valid/returned/rejected → scoring → under_review → amendments → debate → voting → resolved`
- **LLM Tiered Validation**:
  - **<20%**: Returned to author for revision with feedback
  - **20-90%**: Sent to sortition body for human review
  - **>90%**: Auto-approved, advances to scoring
- Author appeal mechanism — any LLM decision can be appealed to a sortition body
- Similar proposal detection & merge workflow (AI-assisted, author confirms)

### 3. Sortition Bodies (Κληρωτά Σώματα)
- Random citizen selection for evaluation tasks — ensures fair participation, prevents power concentration
- Configurable size (absolute number or percentage of community)
- Multiple purposes:
  - **Validity checks** — review proposals in the 20-90% LLM score range
  - **Proposal scoring** — larger body (e.g., 200 members) scores quality + significance
  - **Conflict resolution** — resolve merge disputes between similar proposals
  - **Vote promotion** — approve advancement from deliberation to voting
- Timeout handling with replacement members
- Self-exclusion option for selected members
- Scoring methods: simple majority, enhanced majority, or graded scoring (0-10)

### 4. Amendments (Αντιπροτάσεις & Βελτιώσεις)
- **Improvements** (Βελτιώσεις): Minor text changes to existing proposals
- **Counter-proposals** (Αντιπροτάσεις): Same problem, different solution
- Original author has **veto power** over amendments (preserves proposal coherence)
- LLM validation for amendments follows same tiered logic as proposals
- AI-assisted merge of similar amendments
- **Community Signal**: When author rejects an amendment, community can upvote to signal disagreement — flagged amendments feed into sortition synthesis

### 5. Debate (Διάλογος)
- Structured arguments for/against proposals
- Support/opposition tracking (likes/dislikes from community members)
- Group discussions for large communities (randomly assigned or self-selected)
- Central debate featuring proposal authors
- Text, audio, or video debate formats
- AI-assisted argument summarization

### 6. Proposal Support (Συγκέντρωση Υποστήριξης)
- Community members can support or oppose proposals during deliberation
- Support thresholds configurable per community
- Used to determine which proposals advance to voting
- Minimum participation percentage for valid votes (configurable per community)

### 7. Voting (Ψηφοφορία)
- Multiple voting types: single choice, multiple choice, ranked preferences, sequential rounds
- Minimum participation threshold for validity (configurable per community)
- Secret ballot with verifiable integrity
- Maximum concurrent active votes limit (configurable per community)
- **Ballot voting** (Gov.gr Solemn Declaration PDF verification)

### 8. AI Assistance (Τεχνητή Νοημοσύνη)
- AI as a **support tool only** — never makes final decisions
- Uses: validity checking, similar proposal detection, organization/categorization, debate summarization
- Transparent usage — members know when AI is used
- Results can be reviewed and challenged
- Final decisions always belong to sortition bodies or the full membership

### 9. Governance Parameters (Παράμετροι Διαβούλευσης)
- Per-community configuration of all deliberation rules
- Parameters include: sortition size, response time, minimum participation, voting type, concurrent vote limits
- Communities can evolve governance over time (only toward more autonomy, never less)

---

## Proposal Lifecycle

```
Submitted → LLM Validation → Valid/Returned → Scoring → Under Review → Amendments → Debate → Voting → Resolved
```

1. **Submitted** — Author submits a proposal (question + solution)
2. **Validating** — LLM validates structure, clarity, and completeness (tiered scoring)
3. **Valid/Returned/Rejected** — Based on LLM score: auto-approve (>90%), sortition review (20-90%), or return to author (<20%)
4. **Scoring** — Sortition body scores proposal quality and significance
5. **Under Review** — Community reviews and submits amendments
6. **Amendments** — Author reviews amendments, community signals disagreement with rejections
7. **Debate** — Structured for/against arguments with support tracking
8. **Voting** — Full community votes on the final synthesized text
9. **Resolved** — Results are recorded and published

---

## Database Schema

**Core:** `users`, `polls`, `poll_options`, `votes`, `comments`, `poll_questions`, `poll_answers`, `poll_user_responses`

**Demopolis:** `communities`, `community_members`, `proposals`, `proposal_amendments`, `sortition_bodies`, `sortition_members`, `debate_arguments`, `proposal_support`, `amendment_rejection_votes`

**Security:** `ballot_votes`, `account_activity`, `admin_actions`, `device_fingerprint`, `govgr_verified`

**Notifications:** `poll_notifications`, `sortition_notifications`, `notification_preferences`

**Supporting:** `groups`, `group_members`, `jobs`

---

## Getting Started

### Option 1: Docker Compose (Recommended)

```bash
# Clone and start
git clone https://github.com/miltosdoc/agoraxdemo.git
cd agoraxdemo

# Configure (optional — defaults work for local testing)
cp .env.example .env
# Edit .env for custom DB credentials, LLM keys, etc.

# Start everything (PostgreSQL + API)
docker compose up -d

# Check status
docker compose ps
curl http://localhost:3000/api/health

# Seed demo data (optional)
docker compose exec db psql -U agorax -d agorax -f seed_demo.sql
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
# Set DATABASE_URL in .env (e.g., postgresql://user:pass@localhost:5432/agorax)

# Push schema to database
npm run db:push

# Seed demo data (optional)
psql -d agorax -f seed_demo.sql

# Start development server
./start.sh
```

### Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (**required**)
- `LLM_API_KEY` — API key for LLM validation (optional, uses free tier by default)
- `LLM_MODEL` — LLM model name (default: `nvidia/nemotron-3-nano-30b-a3b:free`)
- `LLM_BASE_URL` — LLM API endpoint (default: `https://staging.xsilico.ai/api/v1`)
- `JWT_SECRET` — Secret for JWT tokens (default: `change-me-in-production`)
- `SESSION_SECRET` — Secret for session cookies (default: `change-me-in-production`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `DEMO_MODE` — Set to `true` to bypass auth for testing
- `PORT` — Backend port (default: 3000)

### Demo Mode

For testing without setting up OAuth:
```bash
export DEMO_MODE=true
./start.sh
```

This bypasses authentication and uses a demo user (ID: 3) for all requests.

---

## Project Structure

```
agoraxdemo/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/             # Route components (20+ pages)
│   │   ├── components/        # Reusable UI components (shadcn/ui + custom)
│   │   ├── hooks/             # Custom React hooks (auth, translation, share, toast)
│   │   ├── lib/               # Utilities (api client, query client, geofencing, i18n types)
│   │   └── App.tsx            # Router configuration
├── server/                    # Express backend
│   ├── index.ts               # Entry point
│   ├── routes.ts              # All API routes (2500+ lines)
│   ├── storage.ts             # IStorage interface + DatabaseStorage
│   ├── auth.ts                # Authentication (sessions, OAuth, Gov.gr)
│   ├── db.ts                  # Drizzle connection
│   ├── seed-demo.ts           # Demo data seeder
│   └── utils/                 # Utilities
│       ├── llm-validation.ts  # LLM proposal validation
│       ├── proposal-state-machine.ts  # State transitions
│       ├── amendment-processor.ts     # Amendment workflow
│       ├── amendment-merger.ts        # AI-assisted merge
│       ├── sortition.ts             # Random selection
│       ├── notifications.ts        # Sortition notification system
│       ├── democracy-score.ts       # Community governance score
│       ├── job-queue.ts             # Background job processing
│       ├── ballot-client.ts         # Gov.gr ballot verification
│       └── geo-region-detector.ts   # Location detection
├── shared/
│   └── schema.ts              # Drizzle schema (928 lines, 21+ tables)
├── ballot_service/            # Python ballot verification (FastAPI + pyhanko)
├── migrations/                # SQL migrations
├── Dockerfile                 # Multi-stage build (Node 20 + canvas)
├── docker-compose.yml         # PostgreSQL + API services
├── drizzle.config.ts          # Drizzle ORM configuration
├── seed_demo.sql              # Demo data seed script
├── start.sh                   # Development startup script
└── README.md                  # This file
```

---

## API Endpoints

### Health
- `GET /api/health` — Service health check (database connectivity)
- `GET /api/ballot/health` — Ballot service health check

### Proposals
- `GET /api/proposals` — List all proposals
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
- `GET /api/proposals/:id/arguments` — List debate arguments
- `POST /api/proposals/:id/arguments` — Create an argument
- `POST /api/arguments/:id/support` — Support an argument
- `POST /api/arguments/:id/oppose` — Oppose an argument

### Sortition
- `POST /api/communities/:id/sortition` — Create sortition body (admin/founder)
- `GET /api/communities/:id/sortition/preview` — Preview sortition selection
- `GET /api/communities/:id/sortition` — List all sortition bodies (admin/founder)
- `GET /api/sortition/:bodyId` — Get sortition body with members
- `POST /api/sortition/:bodyId/complete` — Complete a sortition body (admin/founder)
- `POST /api/sortition/:bodyId/synthesize` — Aggregate scores and auto-complete
- `GET /api/sortition/assignments/:id` — Get sortition assignment
- `POST /api/sortition/assignments/:id/score` — Submit sortition score

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
- `GET /api/ballot/health` — Ballot service status

### Sortition Notifications
- `GET /api/sortition-notifications` — List user's notifications (with unread count)
- `GET /api/sortition-notifications/unread-count` — Lightweight unread count
- `POST /api/sortition-notifications/:id/read` — Mark notification as read
- `POST /api/sortition-notifications/mark-all-read` — Mark all as read
- `GET /api/notification-preferences` — Get user notification preferences
- `PATCH /api/notification-preferences` — Update notification preferences

### Poll Notifications
- `GET /api/notifications` — List poll notifications
- `POST /api/notifications/:id/read` — Mark poll notification as read
- `GET /api/notifications/unread/count` — Get unread poll notification count

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
- `getStatusLabel()`, `getCommunityTypeLabel()` helpers for dynamic content
- date-fns locale-aware formatting (Greek/English relative times)

**Translation files:**
- `client/src/locales/en.ts` — English translations (130+ keys)
- `client/src/locales/el.ts` — Greek translations (130+ keys)

**Adding a new language:**
1. Create `client/src/locales/xx.ts` with the same keys
2. Add the locale to `SUPPORTED_LOCALES` in `client/src/lib/i18n-types.ts`
3. Add flag + name to `LOCALE_FLAGS` / `LOCALE_NAMES`
4. Import in `use-translation.tsx`

---

## Roadmap

### Completed ✅
- [x] Database schema (26 tables) with Drizzle ORM
- [x] Full backend API (Express.js + PostgreSQL)
- [x] LLM validation pipeline (configurable providers)
- [x] Proposal state machine (9 states)
- [x] Amendment flow (author review → community signal → sortition synthesis)
- [x] Debate arguments with support/opposition tracking
- [x] Proposal support/oppose voting
- [x] Sortition body creation with crypto-secure random selection (Fisher-Yates)
- [x] Sortition API routes (create, preview, list, get, complete, score, synthesize)
- [x] Sortition active member exclusion (prevents power concentration)
- [x] Sortition scoring interface
- [x] Sortition notification system (6 notification types, per-user preferences, deadline reminders)
- [x] Auto-transition: sortition_synthesis → voting (when final text is saved)
- [x] Multilingual i18n (Greek default + English, runtime switching, locale-aware dates)
- [x] Language switcher in header (🇬🇷/🇬🇧 dropdown with flags)
- [x] Frontend pages (20+ pages: proposals, amendments, debate, sortition, communities)
- [x] Demo mode for testing without auth
- [x] Docker Compose deployment (PostgreSQL + API + Ballot Service)
- [x] Frontend build in Docker (Vite → Express serveStatic)
- [x] Open Graph image generation for social sharing
- [x] Social bot SEO (Facebook, Twitter, WhatsApp, Telegram previews)
- [x] Health check endpoints (API + Ballot Service)
- [x] Device fingerprinting + IP tracking
- [x] Gov.gr ballot verification (Python microservice, 4-gate PDF validation)
- [x] Ballot client HTTP proxy (Node.js → Python ballot service)
- [x] Demo seed data (3 communities, 5 proposals, debate arguments)
- [x] Survey polls (multi-question with branching logic)
- [x] Geofencing support (location-based polls)
- [x] Community democracy score calculation
- [x] Admin action logging
- [x] Job queue for background tasks
- [x] Rich text editor (TipTap) for proposals

### In Progress ⏳
- [ ] Production authentication (Google OAuth credentials)
- [ ] Notification frontend UI (sortition notifications in header bell)
- [ ] i18n coverage for remaining pages (auth, proposal-detail, sortition pages)
- [ ] Analytics for deliberation metrics

### Future 🚀
- [ ] AI-assisted proposal merging (detect similar proposals)
- [ ] Live debate mode (real-time argument exchange)
- [ ] Video debate integration
- [ ] Community verification (prove you represent a real institution)
- [ ] Cryptographic voting (Helios/ElectionGuard)
- [ ] Multi-community federation
- [ ] Legal status of outcomes (advisory vs. binding)
- [ ] Push notifications / email digests
- [ ] WebSocket real-time updates for sortition deadlines

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes and test locally
4. Run the full test suite: `scripts/run_tests.sh`
5. Submit a pull request

---

## License

MIT License — Copyright (c) 2024-2026 Demopolis Working Group &amp; Miltos Triantafyllou

---

## Contact

Built by the **Demopolis working group**. For questions, contact the maintainers.
