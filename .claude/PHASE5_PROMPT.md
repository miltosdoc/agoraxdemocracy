# Phase 5: Core Functions — Votes, Proposal Workspace, Sortition Experience

## Context
Working on `/tmp/agoraxdemo` — AgoraX deliberation democracy platform. Phases 1-4 complete. Backend is solid. UI has AppShell layout system, proposal index, debate panel, landing/dashboard split. Now we need the 3 highest-impact remaining features.

## Architecture
- **Stack:** React + Vite + wouter (routing) + Tailwind + shadcn/ui components
- **Backend:** Express.js + Drizzle ORM + PostgreSQL
- **Auth:** JWT-based, `useAuth()` hook from `@/hooks/use-auth`
- **API:** `api` object from `@/lib/api` — use `api.get()`, `api.post()`, `api.put()`, `api.delete()`
- **i18n:** `useTranslation()` hook — use `t('key')` for ALL user-facing strings. Add keys to `client/src/locales/el.ts` and `client/src/locales/en.ts`.
- **Layout:** All pages use `<AppShell>` from `@/components/layout/AppShell`
- **Proposal lifecycle:** 8 states in `shared/proposal-lifecycle.ts`: `draft` → `submitted` → `llm_validation` → `author_review` / `sortition` → `author_review` / `voting` → `archived`
- **LifecycleStepper:** `@/components/ui/LifecycleStepper` — takes `state` prop
- **proposal-status lib:** `@/lib/proposal-status` — `statusColor(state)`, `statusLabel(state)`, `statusIcon(state)`, `nextState(state)`

## CRITICAL RULES
1. **i18n:** Use `t('key')` for ALL user-facing text. Add new keys to both `el.ts` and `en.ts`.
2. **AppShell:** Every page must use `<AppShell>`.
3. **No build:** Fix code only, do NOT run build steps.
4. **TypeScript:** Must compile clean (`npx tsc --noEmit`).
5. **Commit after each task:** `git add -A && git commit -m "feat: <description>"`
6. **Check existing code before creating new code.** Backend routes in `server/routes.ts`, storage in `server/storage.ts`, schema in `shared/schema.ts`.

---

## Task 1: Proposal Votes — End-to-End Voting Flow

The `proposal_votes` table exists in the schema but the voting flow is incomplete. Wire it up:

### Backend (if not already done)
Check `server/routes.ts` and `server/storage.ts` for existing vote endpoints. If missing, add:
- `POST /api/proposals/:id/votes` — Cast a vote (for/against/abstain). Check user hasn't already voted. Record in `proposal_votes` table.
- `GET /api/proposals/:id/votes` — Get vote tally (for/against/abstain counts, percentages)
- `GET /api/proposals/:id/votes/my` — Get current user's vote on this proposal

### Frontend — VotePanel component
Create `client/src/components/voting/VotePanel.tsx`:
- Shows when proposal state is `voting`
- Vote buttons: For / Against / Abstain
- Shows current tally with percentages and vote counts
- Shows user's current vote (if any)
- "Change Vote" option
- Disabled after voting period ends
- API: Use endpoints above

### Integrate into proposal-detail.tsx
Add VotePanel as a section/tab when proposal state is `voting`.

---

## Task 2: Proposal Detail Workspace

The proposal detail page exists but is not a cohesive workspace. Rebuild it as a proper workspace:

### Layout
- **Top:** Proposal title, author, community, submission date
- **Lifecycle Stepper:** Show current state with `LifecycleStepper` component
- **Next Action Panel:** Based on current state, show what action is available:
  - `draft` → "Submit for Review" button
  - `submitted` → "Waiting for LLM validation" status
  - `llm_validation` → Progress indicator
  - `author_review` → "Revise & Resubmit" button + validation feedback display
  - `sortition` → "Citizen jury reviewing" status + body progress
  - `voting` → VotePanel (from Task 1)
  - `archived` → "This proposal has been archived" status

### Tabs/Sections
Organize content into collapsible sections or tabs:
1. **Overview** — Proposal question + solution text, LLM validation score/reasoning
2. **Debate** — DebatePanel (already exists)
3. **Amendments** — List of amendments with status (pending/accepted/rejected), similarity groups
4. **Sortition** — Body summary (if active): member count, scores, average, deadline
5. **Votes** — VotePanel (from Task 1, only visible when state is `voting`)

### Implementation
- Edit `client/src/pages/proposal-detail.tsx`
- Use AppShell with title=proposal title, breadcrumb=[{label: "Proposals", href: "/proposals"}, {label: title}]
- Keep existing data fetching logic, reorganize the UI

---

## Task 3: Sortition Member Experience

When a user is selected for a sortition body, they need a clear experience:

### Scoring Interface
Create `client/src/pages/sortition-assignment.tsx`:
- Route: `/sortition/assignment/:bodyId`
- Shows the proposal being evaluated (title, question, solution summary)
- **Score slider:** 0-100 with visual indicator (red→yellow→green gradient)
- **Feedback textarea:** Optional comments explaining the score
- **Submit button:** Posts score to `POST /api/sortition/assignments/:id/score`
- **Deadline countdown:** Shows time remaining
- **Body context:** Shows how many members total, how many have scored
- Already scored? Show the user's previous score with option to revise (if allowed)

### Dashboard Integration
Edit `client/src/pages/home-page.tsx` (or sortition-dashboard.tsx):
- Add "Active Assignments" section at top
- List sortition bodies where the user is a member and hasn't scored yet
- Each item shows: proposal title, deadline, body size, "Score Now" button
- If no active assignments, show "No current assignments" message

### Notification Badge
In the Header (`client/src/components/layout/header.tsx`):
- Add a bell icon with unread notification count
- Link to `/sortition` dashboard
- Use `GET /api/sortition-notifications/unread-count` endpoint

---

## After Each Task
1. Run `npx tsc --noEmit` to verify clean compilation
2. `git add -A && git commit -m "feat: <task description>"`
3. Move to next task

## Order
Do tasks in order: 1 → 2 → 3. If you run out of quota mid-task, commit what compiles cleanly and stop.
