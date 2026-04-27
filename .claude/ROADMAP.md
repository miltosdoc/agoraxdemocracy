# AgoraX — Project Roadmap

**Last updated:** 2026-04-28 (Phase 5 complete)

---

## Completed

### Phase 1: Foundation (TS burndown, storage audit, proposal_votes)
- TypeScript errors → 0
- Storage method audit — all 79+ methods verified
- `proposal_votes` table wired
- Seed alignment with 8-state lifecycle
- Dead code removal

### Phase 2: Coherence Layer
- Sortition system — selection, scoring, timeout, replacement, completion
- Amendment system — TF-IDF + cosine similarity for deduplication
- LLM validation — auto-routing by score (<20 → author_review, 20-90 → sortition, >90 → voting)
- Job queue — 6 handlers registered, wired into server startup

### Phase 3: Core Systems
- Debate system — threaded discussions, upvote/downvote, per-user voting constraint
- Community system — autonomous/managed split, General community auto-enrollment
- Platform settings — stored as governance proposals
- Sortition UI — personal dashboard, body detail, selection ceremony page

### Phase 4: UI Coherence
- **AppShell** — unified layout with breadcrumbs, title/actions, Header/Footer/BottomNav
- **LifecycleStepper** — visual stepper for all 8 proposal states
- **Proposal Status Lib** — color/label/icon/next-state for every lifecycle state
- **Proposal Index** (`/proposals`) — filters (status/community/date), search, sort, pagination
- **Debate UI** — DebatePanel with threaded replies, voting, stats banner
- **Dashboard Split** — `/` = public landing page, `/home` = authenticated dashboard
- All pages migrated to AppShell layout

### Phase 5: Proposal Workspace & Voting
- **VotePanel** (363 LOC) — full voting component with progress bars, participation tracking, finalize
- **AmendmentsPanel** — status badges, duplicate grouping, community signal, submit form
- **SortitionPanel** — body status, member count, response rate, average score, deadline
- **NextActionPanel** — context-aware action panel based on proposal lifecycle state
- **Proposal Detail** — 5-tab workspace (Overview, Debate, Amendments, Sortition, Votes)
- **i18n** — 12 new keys (en/el): amendments.new, amendments.placeholder, amendments.submit,
  amendments.submitFailed, amendments.duplicateGroup, proposal.questionLabel

---

## Remaining — Priority Order

### 1. Platform Settings UI
- **Status:** Backend exists (platform_settings table), no UI
- **What's needed:** Admin interface for platform-wide settings (min participation, sortition size, etc.)
- **Why first:** Needed for production governance configuration

### 2. Community Type Display
- **Status:** Backend has autonomous/managed split
- **What's needed:** Badges/indicators on community cards showing governance type

### 3. Attendance Tracking System
- **Status:** Not yet implemented
- **What's needed:** Backend schema, API endpoints, UI for tracking community member attendance

### 4. Search & Discovery
- **Status:** Not yet implemented
- **What's needed:** Full-text search across proposals, debates, amendments

### 5. Mobile Responsiveness
- **Status:** Basic responsive layout exists
- **What's needed:** Mobile-first refinements, touch-friendly interactions

### 6. LLM Validation UI
- **Status:** Backend complete (OpenRouter free models, score-based routing)
- **What's needed:**
  - Validation results display (score, category, reasoning)
  - "Resubmit" flow for author_review proposals
  - Validation progress indicator during LLM processing

### 7. Notifications System
- **Status:** `sortitionNotifications` table exists
- **What's needed:**
  - In-app notification center
  - Proposal state change notifications
  - Sortition selection notifications
  - Debate reply notifications
  - Email notifications (optional, lower priority)

### 7. Search & Discovery
- **Status:** Proposal index has basic search
- **What's needed:**
  - Full-text search across proposals, debates, amendments
  - Community browsing page
  - "Trending" / "Most Debated" / "Needs Your Vote" sections

### 8. Mobile Responsiveness
- **Status:** BottomNav exists, but pages may not be fully responsive
- **What's needed:**
  - Audit all pages on mobile viewport
  - Fix layout issues, touch targets, scroll behavior
  - Debate panel mobile optimization

### 9. Performance & Caching
- **Status:** Not yet addressed
- **What's needed:**
  - React Query or SWR for data fetching with caching
  - Infinite scroll for proposal index
  - Debounced search
  - Skeleton loaders

### 10. Polish & Launch Prep
- **Status:** Future
- **What's needed:**
  - Error boundaries, empty states, loading states everywhere
  - Accessibility audit (keyboard nav, ARIA labels, contrast)
  - i18n completeness (all strings in both el/en)
  - Docker Compose production config
  - Deployment documentation

---

## Architecture Summary

**Backend:** Express.js + Drizzle ORM + PostgreSQL
- 24 tables, 80+ API endpoints, 79+ storage methods
- 8-state proposal lifecycle with state machine
- Job queue for async tasks (sortition timeout, LLM validation, notifications)
- TF-IDF amendment similarity, sortition algorithm, debate voting

**Frontend:** React + Vite + wouter + Tailwind + shadcn/ui
- AppShell layout system (all pages migrated)
- LifecycleStepper + proposal-status utilities
- i18n: Greek (el) + English (en)
- Auth: JWT-based with `useAuth()` hook

**Key Files:**
- `server/routes.ts` — API endpoints
- `server/storage.ts` — IStorage interface + 79+ methods
- `server/utils/proposal-state-machine.ts` — lifecycle transitions
- `server/utils/sortition.ts` — sortition algorithm
- `server/utils/amendment-similarity.ts` — TF-IDF + cosine
- `server/utils/debate.ts` — threaded debate logic
- `server/utils/community-manager.ts` — community CRUD
- `shared/schema.ts` — Drizzle schema
- `client/src/App.tsx` — route definitions
- `client/src/components/layout/AppShell.tsx` — unified layout
- `client/src/components/ui/LifecycleStepper.tsx` — proposal state visualization
- `client/src/lib/proposal-status.ts` — status utilities

---

## Score Thresholds

**LLM Validation:**
- `<20` → `author_review` (rejected, author must revise)
- `20-90` → `sortition` (needs citizen jury)
- `>90` → `voting` (auto-approved, goes straight to vote)

**Sortition Completion:**
- `≤33` → `author_review` (jury rejected)
- `34-100` → `voting` (jury approved)
- `null` → `archived` (timeout, no quorum)
