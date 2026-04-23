<div align="center">
  <img src="./logo.png" alt="AgoraX Logo" width="200" height="200" />
  <h1>AgoraX — Digital Democracy Platform</h1>
  <p>Participatory deliberation &amp; voting for Greek communities</p>
</div>

---

AgoraX is a digital democracy platform built for Greek citizens to participate in transparent, reliable deliberation and voting processes. The platform combines structured deliberation cycles — proposal submission, LLM-assisted validation, sortition-based evaluation, debate, and final voting — with modern web technologies and location-based features.

Built by the **Demopolis** working group. Specifications in Greek docs at `~/.hermes/demopolis/Draft/docs/`.

---

## Vision

AgoraX implements a **multi-stage deliberation cycle** inspired by ancient Athenian democracy and modern sortition-based governance:

1. **Proposal Submission** — Any community member submits a proposal (question + solution)
2. **LLM Validation** — AI scores proposals on relevance, clarity, and appropriateness
3. **Sortition Evaluation** — Randomly selected citizens evaluate borderline proposals
4. **Amendments** — Community members propose improvements; original author has veto
5. **Debate** — Structured arguments for/against with community support tracking
6. **Voting** — Final decision through ranked-choice or single-choice polls

This replaces simple polling with a **structured deliberation pipeline** that reduces noise, amplifies quality proposals, and ensures fair participation through random selection.

---

## Current Features

### Poll Management
- **Standard Polls**: Simple voting with multiple choice options and ranking support
- **Survey Polls**: Complex questionnaires with multi-step voting interface
  - Three question types: single choice, multiple choice, ordering/ranking
  - Conditional/branching questions based on previous answers
  - Progress tracking through multi-question surveys
- Location-based restrictions with GPS geofencing
- Time-based poll scheduling and automatic expiration

### Location Services
- GPS-based user location detection and verification
- Reverse geocoding using OpenStreetMap Nominatim API
- Geographic region detection for Greek territories
- Geofenced poll participation based on coordinates

### Identity & Security
- **Unique Voter Verification**: "One Account - One Person - One Vote"
- **Gov.gr Integration**: Validates digital signatures from Greek government portal
- **Solemn Declaration Verification**: Users upload digitally signed declarations
- **Anti-Fraud**: Prevents duplicate voting without storing sensitive personal data

### Authentication
- Local authentication with secure password hashing
- Google OAuth integration
- Session-based authentication with secure cookies
- Role-based access control (admin/user roles)

### Content Management
- Rich text content creation with TipTap editor
- Comment system with threaded discussions
- File upload and image processing

### Analytics & Reporting
- Comprehensive analytics dashboard
- User engagement tracking and statistics
- Poll popularity and participation metrics
- Activity trend analysis with visual charts

---

## Demopolis Features (In Development)

### Communities (Κοινότητες)
- **Autonomous Communities** — Horizontal governance, no admins required
- **Managed Communities** — Admin team with defined powers, revocable by members
- **Hybrid Model** — Member-driven with administrative guidance
- Per-community deliberation parameters (sortition size, minimum participation, etc.)
- Democracy score — computed metric showing how democratic the community governance is

### Proposals (Προβουλεύματα)
- Question + Solution format (Το Ερώτημα + Η Απάντηση/Λύση)
- Full state machine: `submitted → validating → valid/returned/rejected → scoring → under_review → amendments → debate → voting → resolved`
- LLM tiered validation:
  - **&lt;20%**: Returned to author for revision
  - **20-90%**: Sent to sortition body for human review
  - **&gt;90%**: Auto-approved, advances to scoring
- Author appeal mechanism — any LLM decision can be appealed to a sortition body

### Sortition Bodies (Κληρωτά Σώματα)
- Random citizen selection for evaluation tasks
- Configurable size (absolute number or percentage of community)
- Multiple purposes: validity checks, proposal scoring, conflict resolution, vote promotion
- Timeout handling with replacement members
- Self-exclusion option for selected members

### Amendments (Αντιπροτάσεις & Βελτιώσεις)
- **Improvements** (Βελτιώσεις): Minor text changes to existing proposals
- **Counter-proposals** (Αντιπροτάσεις): Same problem, different solution
- Original author has **veto power** over amendments (preserves proposal coherence)
- LLM validation for amendments follows same tiered logic

### Debate (Διάλογος)
- Structured arguments for/against proposals
- Support/opposition tracking (likes/dislikes)
- Group discussions for large communities
- Central debate featuring proposal authors

### Proposal Support (Συγκέντρωση Υποστήριξης)
- Community members can support or oppose proposals during deliberation
- Support thresholds configurable per community
- Used to determine which proposals advance to voting

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js/React, Wouter (routing), TanStack Query, TipTap (rich text) |
| **Backend** | Express.js, Node.js |
| **Database** | PostgreSQL with Drizzle ORM |
| **Ballot Service** | Python FastAPI (PDF verification, Gov.gr signature validation) |
| **Authentication** | Sessions + cookies, Google OAuth, Gov.gr digital signatures |
| **Geolocation** | OpenStreetMap Nominatim API, reverse geocoding |
| **LLM Validation** | Configurable (Ollama local, OpenRouter, Anthropic) |
| **Deployment** | Docker-ready, Vercel/Netlify compatible |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  React + Wouter Router + TanStack Query + TipTap Editor      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/JSON
┌──────────────────────────▼──────────────────────────────────┐
│                         Backend                              │
│  Express.js Routes → Storage Layer (IStorage) → Drizzle ORM │
│                                                              │
│  Routes: polls, surveys, groups, communities, proposals,     │
│          sortition, amendments, debate, ballot verification  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      PostgreSQL                              │
│  Tables: users, polls, communities, proposals,               │
│          sortition_bodies, amendments, debate_arguments      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Ballot Service (Python)                     │
│  FastAPI — PDF signature validation, Gov.gr verification     │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema (21 Tables)

**Core:** `users`, `polls`, `poll_options`, `votes`, `comments`, `poll_questions`, `poll_answers`, `poll_user_responses`

**Demopolis (New):** `communities`, `community_members`, `proposals`, `proposal_amendments`, `sortition_bodies`, `sortition_members`, `debate_arguments`, `proposal_support`

**Supporting:** `groups`, `group_members`, `poll_notifications`, `account_activity`, `ballot_votes`

---

## Roadmap

### Phase 1: Schema Foundation ✅ DONE
- [x] Add `communities` table (type, governance model, deliberation parameters)
- [x] Add `community_members` table (roles: member/admin/founder)
- [x] Add `proposals` table (question + solution, state machine, LLM score)
- [x] Add `proposal_amendments` table (improvements & counter-proposals)
- [x] Add `sortition_bodies` + `sortition_members` tables
- [x] Add `debate_arguments` table (for/against with support counts)
- [x] Add `proposal_support` table (likes/dislikes during deliberation)
- [x] Relations, insert schemas, type exports
- [x] Drizzle migration generated

### Phase 2: Backend — Storage & Routes
- [ ] Extend `IStorage` interface with community/proposal/sortition methods
- [ ] Implement `PostgresStorage` methods for all new tables
- [ ] Community CRUD routes (`/api/communities`)
- [ ] Proposal submission & lifecycle routes (`/api/communities/:id/proposals`)
- [ ] Sortition creation & scoring routes (`/api/sortition`)
- [ ] Amendment routes (`/api/proposals/:id/amendments`)
- [ ] Debate argument routes (`/api/proposals/:id/arguments`)
- [ ] Proposal support routes (`/api/proposals/:id/support`)

### Phase 3: LLM Validation Service
- [ ] Create `server/utils/llm-validator.ts`
- [ ] Implement tiered scoring logic (&lt;20%, 20-90%, &gt;90%)
- [ ] Greek-language prompt design for proposal evaluation
- [ ] Configurable LLM backend (Ollama, OpenRouter, Anthropic)
- [ ] Async validation with status updates
- [ ] Appeal mechanism implementation

### Phase 4: State Machine & Workflow
- [ ] Create `server/utils/proposal-state-machine.ts`
- [ ] Implement valid state transitions
- [ ] Side effects per transition (trigger LLM, create sortition, etc.)
- [ ] Sortition selection algorithm (random, activity-weighted)
- [ ] Sortition timeout & replacement logic
- [ ] Amendment merge/reject workflow with author veto

### Phase 5: Frontend Pages
- [ ] Community Dashboard (`/communities/:id`)
- [ ] Proposal Submission Form (`/communities/:id/proposals/new`)
- [ ] Proposal Detail Page (`/proposals/:id`) with state machine visualization
- [ ] Sortition Scoring Interface (`/sortition/:bodyId`)
- [ ] Debate View with structured arguments
- [ ] Navigation updates (App.tsx routes + bottom-nav)

### Phase 6: Integration & Polish
- [ ] Migration from `groups` → `communities` (backward compatibility)
- [ ] Link existing polls to communities
- [ ] Notification system for sortition assignments
- [ ] Analytics for deliberation metrics
- [ ] i18n for all new Greek UI text
- [ ] End-to-end testing of proposal lifecycle

### Phase 7: Advanced Features (Future)
- [ ] AI-assisted proposal merging (detect similar proposals)
- [ ] Live debate mode (real-time argument exchange)
- [ ] Video debate integration
- [ ] Democracy score computation algorithm
- [ ] Community verification (prove you represent a real institution)
- [ ] Crypto token for participation incentives
- [ ] Multi-language support (Greek/English/Swedish)

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Python 3.10+ (for ballot service)

### Setup

```bash
# Clone and install
cd agoraxdemo
npm install

# Database
cp .env.example .env
# Set DATABASE_URL in .env

# Push schema to database
npm run db:push

# Run migrations (if any exist)
npx drizzle-kit migrate

# Start development server
npm run dev
```

### Ballot Service (Gov.gr Verification)

```bash
cd ballot_service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

---

## Project Structure

```
agoraxdemo/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/             # Route components
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities (queryClient, i18n)
│   │   └── App.tsx            # Router configuration
├── server/                    # Express backend
│   ├── index.ts               # Entry point
│   ├── routes.ts              # All API routes (1,793 lines)
│   ├── storage.ts             # IStorage interface + PostgresStorage (2,615 lines)
│   ├── auth.ts                # Authentication setup
│   ├── db.ts                  # Drizzle connection
│   └── utils/                 # Utilities (geo, ballot client)
├── shared/
│   └── schema.ts              # Drizzle schema + Zod schemas (864 lines)
├── ballot_service/            # Python FastAPI for Gov.gr verification
├── migrations/                # Drizzle SQL migrations
├── MERGE_PLAN.md              # Demopolis → AgoraX merge plan
└── README.md                  # This file
```

---

## Demopolis Specifications

The Demopolis working group maintains detailed design documents in Greek:

- **`00_Πληρης_Τεκμηριωση.md`** — Complete specification (187 lines)
- **`concepts/community-types.md`** — Autonomous vs managed communities
- **`concepts/core-features.md`** — Platform capabilities
- **`concepts/members.md`** — Membership & verification
- **`procedures/proposals.md`** — Proposal lifecycle
- **`procedures/sortition.md`** — Sortition body mechanics
- **`procedures/consultation.md`** — Deliberation parameters
- **`procedures/dialogue.md`** — Structured debate
- **`procedures/voting.md`** — Voting types & validity
- **`features/ai.md`** — LLM usage guidelines
- **`governance/statutes_proposal.md`** — Platform governance rules

---

## License

Open source — see LICENSE file.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes, add tests
4. Run `npm run check` to verify TypeScript
5. Run `npx drizzle-kit generate` if schema changes
6. Submit a pull request

For schema changes, always run the full test suite before pushing:
```bash
scripts/run_tests.sh
```

---

## Contact

Built by the Demopolis working group. For questions, contact the maintainers.
