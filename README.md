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
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      PostgreSQL                              │
│  Tables: users, polls, communities, proposals,               │
│          sortition_bodies, amendments, debate_arguments      │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + Vite, Wouter (routing), shadcn/ui, Tailwind CSS |
| **Backend** | Express.js, Node.js |
| **Database** | PostgreSQL with Drizzle ORM |
| **Authentication** | Sessions + cookies, Google OAuth |
| **LLM Validation** | Configurable (NVIDIA Nemotron free tier, OpenRouter, Anthropic) |
| **Deployment** | Docker-ready |

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
- Full state machine: `draft → review → author_review → community_signal → sortition_synthesis → voting → decided`
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
┌─────────┐    ┌────────┐    ┌──────────────┐    ┌────────────────┐    ┌──────────────────┐    ┌────────┐    ┌─────────┐
│  Draft  │───▶│ Review │───▶│ Author Review│───▶│ Community      │───▶│ Sortition        │───▶│ Voting │───▶│ Decided │
│         │    │ (LLM)  │    │ (Accept/     │    │ Signal         │    │ Synthesis        │    │        │    │         │
│         │    │        │    │  Reject)     │    │ (Upvote/       │    │ (Compose final   │    │        │    │         │
│         │    │        │    │              │    │  Downvote)     │    │  text)           │    │        │    │         │
└─────────┘    └────────┘    └──────────────┘    └────────────────┘    └──────────────────┘    └────────┘    └─────────┘
```

1. **Draft** — Author submits a proposal (question + solution)
2. **Review** — LLM validates structure, clarity, and completeness (tiered scoring)
3. **Author Review** — Author reviews amendments, accepts or rejects each
4. **Community Signal** — Community upvotes rejected amendments to signal disagreement
5. **Sortition Synthesis** — Randomly selected citizens compose the final text using author's draft + flagged amendments
6. **Voting** — Full community votes on the final synthesized text
7. **Decided** — Results are recorded and published

---

## Database Schema

**Core:** `users`, `polls`, `poll_options`, `votes`, `comments`, `poll_questions`, `poll_answers`, `poll_user_responses`

**Demopolis:** `communities`, `community_members`, `proposals`, `proposal_amendments`, `sortition_bodies`, `sortition_members`, `debate_arguments`, `proposal_support`, `amendment_rejection_votes`

**Supporting:** `groups`, `group_members`, `poll_notifications`, `account_activity`, `admin_actions`, `jobs`

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup

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

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `LLM_API_KEY` | API key for LLM validation | No (uses free tier by default) |
| `LLM_MODEL` | LLM model name (default: `nvidia/nemotron-3-nano-30b-a3b:free`) | No |
| `LLM_BASE_URL` | LLM API endpoint (default: `https://staging.xsilico.ai/api/v1`) | No |
| `DEMO_MODE` | Set to `true` to bypass auth for testing | No |
| `PORT` | Backend port (default: 3000) | No |

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
│   │   ├── pages/             # Route components
│   │   ├── components/        # Reusable UI components (shadcn/ui)
│   │   ├── lib/               # Utilities (api client, query client)
│   │   └── App.tsx            # Router configuration
├── server/                    # Express backend
│   ├── index.ts               # Entry point
│   ├── routes.ts              # All API routes
│   ├── storage.ts             # IStorage interface + PostgresStorage
│   ├── auth.ts                # Authentication setup
│   ├── db.ts                  # Drizzle connection
│   └── utils/                 # Utilities (LLM validation, state machine)
├── shared/
│   └── schema.ts              # Drizzle schema + type exports
├── migrations/                # SQL migrations
├── seed_demo.sql              # Demo data seed script
├── start.sh                   # Development startup script
└── README.md                  # This file
```

---

## API Endpoints

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
- `GET /api/sortition/assignments/:id` — Get sortition assignment
- `POST /api/sortition/assignments/:id/score` — Submit sortition score

### Communities
- `GET /api/communities` — List all communities
- `GET /api/communities/:id` — Get community details
- `POST /api/communities` — Create a community
- `GET /api/communities/:id/democracy-score` — Get democracy score

---

## Roadmap

### Completed ✅
- [x] Database schema (21+ tables) with Drizzle ORM
- [x] Full backend API (Express.js + PostgreSQL)
- [x] LLM validation pipeline (NVIDIA Nemotron free tier)
- [x] Proposal state machine (7 states)
- [x] Amendment flow (author review → community signal → sortition synthesis)
- [x] Debate arguments with support/opposition tracking
- [x] Proposal support/oppose voting
- [x] Sortition scoring interface
- [x] Frontend pages (proposal detail, amendment review, community signal, sortition synthesis)
- [x] Demo mode for testing without auth
- [x] Vite proxy configuration for frontend-backend communication

### In Progress ⏳
- [ ] Sortition body composition algorithm (random selection)
- [ ] Sortition membership verification enforcement
- [ ] Automated state transitions (e.g., sortition complete → voting)
- [ ] Production authentication (Google OAuth)
- [ ] Notification system for sortition assignments
- [ ] Analytics for deliberation metrics

### Future 🚀
- [ ] AI-assisted proposal merging (detect similar proposals)
- [ ] Live debate mode (real-time argument exchange)
- [ ] Video debate integration
- [ ] Community verification (prove you represent a real institution)
- [ ] Multi-language support (Greek/English/Swedish)
- [ ] Cryptographic voting (Helios/ElectionGuard)
- [ ] Multi-community federation
- [ ] Legal status of outcomes (advisory vs. binding)

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
