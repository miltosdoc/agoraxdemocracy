# AgoraX — Phase 7: Production Readiness

## Context
You are working on `/tmp/agoraxdemo` — the AgoraX deliberation democracy platform.
This is a React + Express + Drizzle ORM + PostgreSQL application.
All code must be TypeScript-clean (0 errors). Use `@/hooks/use-translation` for i18n (NOT direct `react-i18next` imports).

## What's Already Done
- Phase 1-5: Complete (Foundation, Coherence, Core Systems, UI Coherence, Proposal Workspace)
- Phase 6a: Platform Settings Backend + UI, Attendance Schema
- Phase 7a: Notification Center (types, hooks, page, header integration) — committed `3277d0c`

## Your Tasks (Priority Order)

### 1. Attendance Backend + UI
The `sortitionAttendance` table exists in `shared/schema.ts` with fields:
`bodyId`, `userId`, `status` (invited/accepted/declined/no-show), `scored`, `score`, `notes`, timestamps.

**Backend:**
- Add storage methods to `server/storage.ts` (IStorage interface + DatabaseStorage):
  - `getAttendanceByBody(bodyId)`
  - `createAttendance(bodyId, userId, status)`
  - `updateAttendance(id, updates)`
  - `getAttendanceByUser(userId)`
- Add API routes to `server/routes.ts`:
  - `GET /api/sortition-attendance/body/:bodyId` — list all attendance for a body
  - `POST /api/sortition-attendance` — create attendance record
  - `PATCH /api/sortition-attendance/:id` — update attendance
  - `GET /api/sortition-attendance/user/:userId` — user's attendance history

**Frontend:**
- Create `client/src/components/sortition/AttendancePanel.tsx`:
  - Shows attendance table for a sortition body
  - Columns: User, Status (badge), Score, Notes
  - Summary: Total invited, accepted, declined, no-show, scored
  - Admin can update status/notes
- Integrate into `SortitionPanel.tsx` as a new tab or expandable section

### 2. Search & Discovery
**Backend:**
- Add `GET /api/search?q=<query>&type=proposals|debates|amendments&communityId=<optional>` to `server/routes.ts`
- Search across: proposal question/solution, debate thread titles/content, amendment text
- Return paginated results with type indicators

**Frontend:**
- Create `client/src/pages/search.tsx`:
  - Search bar with debounced input
  - Filter tabs: All / Proposals / Debates / Amendments
  - Results list with type badges and snippets
  - "Trending" section: most debated proposals (by debate count)
  - "Needs Your Vote" section: proposals in voting status where user hasn't voted
- Add `/search` route to `client/src/App.tsx`
- Add search link to Header (magnifying glass icon)

### 3. Mobile Responsiveness
**Audit & Fix:**
- Check all pages on mobile viewport (< 768px):
  - `client/src/pages/proposals.tsx` — filter layout, table → cards
  - `client/src/pages/proposal-detail.tsx` — 5-tab layout, tabs → dropdown on mobile
  - `client/src/pages/notifications.tsx` — already responsive? Verify
  - `client/src/pages/search.tsx` — just created, ensure responsive
  - `client/src/pages/platform-settings.tsx` — form layout
  - `client/src/pages/home.tsx` — dashboard grid
  - `client/src/pages/landing.tsx` — hero section
- Fix common issues:
  - Overflow on narrow screens
  - Touch targets too small (< 44px)
  - Horizontal scroll where it shouldn't be
  - BottomNav covering content
- Add `meta viewport` if missing in `client/index.html`

### 4. LLM Validation UI
**Frontend:**
- Create `client/src/components/proposal/ValidationPanel.tsx`:
  - Shows LLM validation score (0-100) with color-coded progress bar
  - Shows LLM feedback text
  - Shows validation timestamp
  - For `author_review` status: "Resubmit" button that transitions to `review` status
  - For `review` status: "Request Validation" button that triggers LLM validation job
- Integrate into `proposal-detail.tsx` Overview tab (enhance existing llmScore/llmFeedback display)
- Add validation progress indicator (spinner) while LLM is processing

**Backend (if missing):**
- `POST /api/proposals/:id/request-validation` — triggers LLM validation job
- `POST /api/proposals/:id/resubmit` — transitions author_review → review, clears LLM score

### 5. Build & Deploy
After all code changes:
1. Run `npx tsc --noEmit` — must be 0 errors
2. Run `npm run build` in `client/` directory
3. Run `docker compose up -d --build` to start the full stack
4. Report the URL (likely `http://localhost:3000` or whatever port the container exposes)

## Constraints
- Working directory: `/tmp/agoraxdemo`
- Use `@/hooks/use-translation` for all i18n (NOT `react-i18next` directly)
- All new strings need i18n keys in BOTH `client/src/locales/en.ts` AND `client/src/locales/el.ts`
- Use shadcn/ui components where available
- Follow existing code patterns (AppShell layout, useAuth hook, api.get/post)
- No build during development — only build at the very end
- Commit after each major task, push to `origin/main` at the end

## Quality Bar
- TypeScript: 0 errors
- All pages use AppShell layout
- All strings internationalized (en + el)
- Mobile responsive (< 768px)
- Docker compose builds and starts successfully
- Demo users can login (miltos/eleni/giorgos/maria/kostas — any password works)

## After Completion
1. `git add -A && git commit -m "feat: Phase 7 — Production Readiness"`
2. `git push origin main`
3. `docker compose up -d --build`
4. Report: Docker container status, app URL, any remaining issues
