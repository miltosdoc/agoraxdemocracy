# Phase 4b: UI Core Functions — Proposal Index, Debate UI, Dashboard Split

## Context
Working on `/tmp/agoraxdemo` — AgoraX deliberation democracy platform. Backend is complete and pushed. Previous Opus session (Phase 4a) completed AppShell layout system, LifecycleStepper, and proposal-status lib. Now we need the 3 remaining UI tasks.

## Architecture
- **Stack:** React + Vite + wouter (routing) + Tailwind + shadcn/ui components
- **Backend:** Express.js + Drizzle ORM + PostgreSQL
- **Auth:** JWT-based, `useAuth()` hook from `@/hooks/use-auth`
- **API:** `api` object from `@/lib/api` — use `api.get()`, `api.post()`, `api.put()`, `api.delete()`
- **i18n:** `useTranslation()` hook — use `t('key')` for ALL user-facing strings. NEVER put Greek/English text directly in JSX.
- **Layout:** All pages use `<AppShell>` from `@/components/layout/AppShell` — it wraps Header/Footer/BottomNav. Props: `title`, `breadcrumb`, `actions`, `children`.
- **Proposal lifecycle:** 8 states defined in `shared/proposal-lifecycle.ts`: `draft` → `submitted` → `llm_validation` → `author_review` / `sortition` → `author_review` / `voting` → `archived`
- **LifecycleStepper:** Available at `@/components/ui/LifecycleStepper` — takes `state` prop, renders visual progress stepper
- **proposal-status lib:** `@/lib/proposal-status` — `statusColor(state)`, `statusLabel(state)`, `statusIcon(state)`, `nextState(state)`

## CRITICAL RULES
1. **i18n:** Use `t('key')` for ALL user-facing text. Add new keys to `client/src/locales/el.json` and `client/src/locales/en.json` if needed.
2. **AppShell:** Every page must use `<AppShell>` — never import Header/Footer directly.
3. **No build:** Fix code only, do NOT run build steps.
4. **TypeScript:** Must compile clean (`npx tsc --noEmit`).
5. **Commit after each task:** `git add -A && git commit -m "feat(ui): <description>"`

## Task 1: Proposal Index Page (`/proposals`)

Create a new page at `client/src/pages/proposals-page.tsx` that lists all proposals with:

- **Filters:** Status dropdown (all 8 states), community selector, date range
- **Search:** Text search across title and description
- **Sort:** By date (newest/oldest), by score (highest/lowest)
- **Cards:** Each proposal shows title, author name, community, status badge (use `proposal-status` lib), score if available, date
- **Pagination:** Load more or page-based (use whatever's simpler)
- **API:** Use `api.get('/proposals?status=X&community=Y&search=Z&sort=created_desc')` — check `server/routes.ts` for actual query params
- **Route:** Register in `client/src/App.tsx` as `/proposals`
- **Nav:** Add "Proposals" link to Header nav (edit `client/src/components/layout/header.tsx`)

## Task 2: Debate UI

The debate backend is fully implemented (threads, replies, upvotes/downvotes, stats). Create the frontend:

- **DebatePanel component** at `client/src/components/debate/DebatePanel.tsx`:
  - Shows list of debate threads for a proposal
  - Each thread shows: author, timestamp, text, upvote/downvote buttons with counts
  - Reply button expands a text area to add replies
  - "New Thread" button at top (authenticated users only)
  - Thread count and total votes summary at top
- **Integrate into proposal-detail.tsx:** Add a debate tab/section below the proposal content and lifecycle stepper
- **API endpoints** (check `server/routes.ts`):
  - `GET /proposals/:id/debate/threads` — list threads
  - `POST /proposals/:id/debate/threads` — create thread
  - `POST /debate/threads/:id/replies` — add reply
  - `POST /debate/threads/:id/upvote` / `downvote` — vote
  - `GET /debate/threads/:id/stats` — thread stats

## Task 3: Dashboard Split

Currently `/` and `/home` render the same thing. Split them:

- **`/` (Public Landing Page):**
  - Hero section with platform description (use i18n keys)
  - Feature highlights: deliberation, sortition, amendments, debate
  - "Get Started" CTA → `/register` or `/login`
  - If authenticated, redirect to `/home`
  - Edit `client/src/pages/landing-page.tsx` (create if needed)

- **`/home` (Authenticated Dashboard):**
  - Keep existing dashboard content (user's proposals, sortition bodies, activity)
  - Add clear section headers: "My Proposals", "Active Sortitions", "Recent Activity"
  - Use AppShell with title="Dashboard"

- **Route:** Update `client/src/App.tsx`:
  - `/` → LandingPage (redirect to `/home` if authenticated)
  - `/home` → Dashboard (require auth)

## After Each Task
1. Run `npx tsc --noEmit` to verify clean compilation
2. `git add -A && git commit -m "feat(ui): <task description>"`
3. Move to next task

## Order
Do tasks in order: 1 → 2 → 3. If you run out of quota mid-task, commit what compiles cleanly and stop.
