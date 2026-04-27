# AgoraX Phase 7 — Production Readiness

## Context
- Working copy: `/tmp/agoraxdemo`
- Branch: `main`
- Remote: `github.com/miltosdoc/agoraxdemo`
- TS compilation: clean (ignoring node_modules/drizzle errors)
- Docker build: passes
- CI: fixed (lazy db import for state machine tests)

## Completed (Previous Sessions)
- Phase 1: TS burndown, storage audit, proposal_votes wiring
- Phase 2: Amendment merging logic (TF-IDF/Cosine)
- Phase 3: Sortition system (selection, scoring, synthesis, timeout/completion)
- Phase 4: Proposal workspace (5-tab layout: Overview, Debate, Amendments, Sortition, Votes)
- Phase 5: Voting panel, Next Action panel, Amendments panel, Sortition panel
- Phase 6: Platform settings, community badges, attendance schema
- Phase 7a: Notification center (types, hooks, components, /notifications page, header bell)

## Remaining Tasks (Implement All)

### 1. Attendance Backend & UI
- **Backend:** Wire `sortitionAttendance` table (already in schema.ts) with storage methods in `server/storage.ts`:
  - `getAttendance(proposalId, memberId)` → attendance record
  - `upsertAttendance(proposalId, memberId, status, notes)` → insert/update
  - `getAttendanceSummary(proposalId)` → counts by status
- **UI:** In `client/src/pages/sortition-assignment.tsx`, add attendance confirmation flow:
  - Member clicks "Confirm Attendance" or "Decline" on their sortition assignment
  - Shows deadline countdown
  - Stores response in `sortitionAttendance` table
  - Triggers notification to proposal author when ≥50% confirm

### 2. Global Search & Discovery
- **Backend:** Add search endpoint `GET /api/search?q=&type=proposals|members|communities` in `server/routes.ts`
  - Search proposals by question, solution, tags
  - Search members by display name
  - Search communities by name, description
- **Frontend:** Create `client/src/components/SearchBar.tsx` — global search input in header
  - Debounced input, dropdown results, keyboard navigation
  - Route to result on click
- **i18n:** Add keys to both `en.ts` and `el.ts`

### 3. Mobile Responsiveness
- Fix responsive layout issues across key pages:
  - Header: collapse nav to hamburger on mobile
  - Proposal detail: stack tabs vertically on narrow screens
  - Proposal list: single column on mobile
  - Sortition assignment: full-width cards on mobile
  - Platform settings: stacked form fields
- Use Tailwind breakpoints (`sm:`, `md:`, `lg:`) — no media query files
- Test at 320px, 375px, 414px widths

### 4. LLM Validation UI
- **Frontend:** In `client/src/pages/proposal-detail.tsx`, add validation status display:
  - Show LLM score (0-100) with color coding (red <20, yellow 20-90, green >90)
  - Show LLM feedback text
  - Show validation category (return/auto/sortition)
  - Show validation round count
  - "Request Re-validation" button for authors (triggers new LLM validation job)
- **Backend:** Add route `POST /api/proposals/:id/revalidate` in `server/routes.ts`
  - Enqueues new LLM validation job
  - Increments `llmValidationRound`
- **i18n:** Add keys to both `en.ts` and `el.ts`

## Constraints
- Use `@/hooks/use-translation` for i18n (NOT direct react-i18next import)
- All new i18n keys go in BOTH `en.ts` and `el.ts` simultaneously
- Follow existing code patterns — don't introduce new dependencies
- Use Drizzle ORM for all DB access
- Use existing notification system for alerts
- Keep components under ~300 LOC each

## After Implementation
1. Run `npx tsc --noEmit` — must be clean
2. Run `npm run i18n-check` — must pass (en/el parity)
3. Run `npx vitest run` — all tests pass (except state-machine.test.ts which needs DATABASE_URL)
4. Run `docker compose build` — must succeed
5. Commit all changes with descriptive message
6. Push to origin/main
