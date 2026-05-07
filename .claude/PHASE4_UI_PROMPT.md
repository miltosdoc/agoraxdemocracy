# AgoraX Phase 4 — UI Coherence

You are working on `/tmp/agoraxdemo`, an AgoraX deliberation democracy platform. React + Vite frontend, Express + Drizzle backend, PostgreSQL.

## Context

The backend is functionally complete (lifecycle, sortition, amendments, debate, communities, LLM validation). The UI is the bottleneck — inconsistent app shell, missing pages, broken proposal detail. Fix the UI so the product feels coherent.

## Task 1 — AppShell + Lifecycle Stepper

Build a consistent app shell and proposal status system.

**1.1 AppShell component** (`client/src/components/layout/AppShell.tsx`)

Create a reusable shell component that wraps every protected page:
- Props: `title` (page title), `breadcrumb` (optional array of {label, href}), `actions` (optional React nodes for header CTAs)
- Renders: `<Header />` at top, `<Footer />` at bottom, `<BottomNav />` on mobile
- Content area: `className="container mx-auto py-6 px-4 max-w-6xl flex-grow"`
- Breadcrumb: render between header and content if provided
- Every protected page should use this instead of ad-hoc wrapper divs

**1.2 Proposal Status System** (`client/src/lib/proposal-status.ts`)

Create a central status map. Import the canonical lifecycle states from `shared/proposal-lifecycle.ts`:

```typescript
import { ProposalState } from '@/shared/proposal-lifecycle';

export const STATUS_MAP: Record<ProposalState, {
  color: string;        // Tailwind color class (e.g. "bg-blue-100 text-blue-800")
  icon: React.ReactNode; // Simple SVG or emoji
  greekLabel: string;    // Greek display name
  englishLabel: string;
  nextAction: string;    // What the user should do next
}> = {
  draft: { color: "bg-gray-100 text-gray-700", icon: "📝", greekLabel: "Σχέδιο", englishLabel: "Draft", nextAction: "Submit for review" },
  review: { color: "bg-yellow-100 text-yellow-800", icon: "🔍", greekLabel: "Εξέταση", englishLabel: "Review", nextAction: "Waiting for LLM validation" },
  author_review: { color: "bg-orange-100 text-orange-800", icon: "✏️", greekLabel: "Ανάθεση Συγγραφέα", englishLabel: "Author Review", nextAction: "Review and revise" },
  community_signal: { color: "bg-purple-100 text-purple-800", icon: "📢", greekLabel: "Σήμα Κοινότητας", englishLabel: "Community Signal", nextAction: "Vote on amendments" },
  sortition: { color: "bg-indigo-100 text-indigo-800", icon: "🎲", greekLabel: "Κλήρωση", englishLabel: "Sortition", nextAction: "Sortition body deliberating" },
  voting: { color: "bg-green-100 text-green-800", icon: "🗳️", greekLabel: "Ψηφοφορία", englishLabel: "Voting", nextAction: "Cast your vote" },
  decided: { color: "bg-emerald-100 text-emerald-800", icon: "✅", greekLabel: "Απόφαση", englishLabel: "Decided", nextAction: "View result" },
  archived: { color: "bg-red-100 text-red-800", icon: "📦", greekLabel: "Αρχειοθετημένο", englishLabel: "Archived", nextAction: "" },
};

export function getStatusForProposal(proposal: { status: string }) {
  return STATUS_MAP[proposal.status as ProposalState] || STATUS_MAP.draft;
}
```

**1.3 LifecycleStepper component** (`client/src/components/ui/LifecycleStepper.tsx`)

Horizontal stepper showing proposal lifecycle progress:
- Props: `status: string`, `interactive?: boolean` (if true, highlight current step)
- Render all 8 states as steps
- Completed steps: filled circle + label
- Current step: highlighted circle + bold label
- Future steps: empty circle + gray label
- Mobile: vertical stepper instead of horizontal

**1.4 Apply AppShell to all protected pages**

Update these pages to use `<AppShell>` instead of ad-hoc wrappers:
- `/pages/community-dashboard.tsx`
- `/pages/community-settings.tsx`
- `/pages/proposal-detail.tsx`
- `/pages/profile-page.tsx`
- `/pages/sortition-dashboard.tsx`
- `/pages/sortition-body-detail.tsx`
- `/pages/sortition-ceremony.tsx`
- `/pages/sortition-scoring.tsx`
- `/pages/sortition-synthesis.tsx`
- `/pages/amendment-author-review.tsx`
- `/pages/amendment-community-signal.tsx`
- `/pages/analytics-dashboard.tsx`
- `/pages/admin-accounts.tsx`

Also fix `App.tsx` — `CommunitiesPage`, `ProposalFormPage`, and `CommunityFormPage` should use AppShell instead of manual Header/Footer wrappers.

## Task 2 — Proposal Index Page

Create `/pages/proposal-index.tsx` — a proper proposals listing page.

**Features:**
- Grid/list of proposal cards showing: question (truncated), status badge (from STATUS_MAP), community name, author, date, action count
- Filter bar: community dropdown, status filter, author filter
- Search: text search on question field
- Sort: newest first by default, toggle to oldest
- "Create Proposal" CTA button (links to `/proposals/new`)
- Empty state: "No proposals yet. Be the first to create one." with CTA
- Use AppShell with title "Proposals"

**API:** The backend has `GET /api/proposals` — check `server/routes.ts` for the actual endpoint. If it doesn't exist, create it in `server/routes.ts` with pagination support (`?page=1&limit=20&communityId=X&status=X`).

**Route:** Add to `App.tsx`:
```tsx
<ProtectedRoute path="/proposals" component={ProposalIndexPage} />
```

Also update the `/proposals/:id` route to use AppShell wrapper.

## Task 3 — Debate UI

The backend has debate routes (`POST/GET /api/proposals/:id/debate`, `POST /api/debate/:id/vote`, `GET /api/proposals/:id/debate/stats`). Build the frontend.

**3.1 DebateThread component** (`client/src/components/debate/DebateThread.tsx`)

- Props: `thread: DebateThread`, `onVote: (threadId, direction) => void`, `onReply: (parentId, text) => void`
- Show: author avatar/name, timestamp, text, vote buttons (up/down with count), reply count
- Nested replies indented
- Vote toggle: clicking same direction unvotes, clicking opposite swaps

**3.2 DebateList component** (`client/src/components/debate/DebateList.tsx`)

- Props: `proposalId: string`, `threads: DebateThread[]`, `onCreate: (text) => void`, `onReply: (parentId, text) => void`, `onVote: (threadId, direction) => void`
- Thread list sorted by net score (descending)
- "Start Discussion" form at top
- Empty state: "No discussion yet. Start the conversation."

**3.3 Integrate into ProposalDetail**

Add a "Debate" section/tab in `/pages/proposal-detail.tsx`:
- Only visible when proposal status is in deliberation states: `amendments`, `author_review`, `sortition`
- Fetch threads from `GET /api/proposals/:id/debate`
- Show thread stats from `GET /api/proposals/:id/debate/stats`
- Use DebateList component

**3.4 API hooks**

Create React Query hooks in `client/src/hooks/use-debate.ts`:
```typescript
export function useDebateThreads(proposalId: string) { /* fetch GET /api/proposals/:id/debate */ }
export function useDebateStats(proposalId: string) { /* fetch GET /api/proposals/:id/debate/stats */ }
export function useCreateThread(proposalId: string) { /* mutation POST /api/proposals/:id/debate */ }
export function useVoteThread() { /* mutation POST /api/debate/:id/vote */ }
export function useReplyToThread(proposalId: string) { /* mutation POST /api/proposals/:id/debate/:threadId/reply */ }
```

## Task 4 — Dashboard Split

Split `/` (public landing) from `/home` (authenticated workspace).

**4.1 Public Landing (`/pages/home-page.tsx` when not authenticated)**

- Hero section: "AgoraX — Digital Democracy for Greek Communities"
- Brief explanation of the platform (proposals, deliberation, sortition, voting)
- "How it works" section (3-4 steps)
- CTA: "Get Started" → `/auth`
- No proposal data, no user-specific content

**4.2 Authenticated Dashboard (`/pages/home-page.tsx` when authenticated)**

- Title: "Your Dashboard" via AppShell
- Sections in priority order:
  1. **Pending Actions** — proposals awaiting your vote, amendments to review, sortition assignments
  2. **Active Proposals** — proposals in deliberation/voting states across your communities
  3. **Recent Decisions** — recently decided proposals
  4. **Your Communities** — quick links to communities you belong to
- Honest empty states: "No pending actions" / "No active proposals" / "Join a community to start"
- No hero banner

**4.3 Route logic in App.tsx**

```tsx
<Route path="/" component={HomePage} />  // Public or authenticated — HomePage handles both
<ProtectedRoute path="/home" component={HomePage} />  // Same component, different mode
```

The HomePage component should check `useAuth()` and render different content based on authentication state.

## Task 5 — Community Type Display

The backend now has autonomous/managed community types. Update the UI to reflect this.

**5.1 CommunityBadge component** (`client/src/components/community/CommunityBadge.tsx`)

- Props: `type: 'autonomous' | 'managed'`, `isGeneral?: boolean`
- Render: colored badge with Greek label
  - Autonomous: "Αυτόνομη" (blue)
  - Managed: "Διαχειριζόμενη" (purple)
  - General: "Γενική Κοινότητα" (gold)

**5.2 Update CommunityList** (`client/src/components/community/community-list.tsx`)

- Show CommunityBadge on each community card
- Show member count, proposal count
- Link to community dashboard

**5.3 Update CommunityDashboard** (`/pages/community-dashboard.tsx`)

- Show community type badge prominently
- For managed communities: show admin panel section (add/remove members, settings)
- For autonomous communities: show "Transition to Managed" proposal CTA
- Show governance settings summary

## Constraints

- Use existing UI components from `client/src/components/ui/` (shadcn-based: Button, Card, Badge, Tabs, etc.)
- Use existing i18n system (`useTranslation` hook, `t()` function)
- Use React Query (`@tanstack/react-query`) for data fetching — check existing hooks in `client/src/hooks/`
- Use Tailwind CSS for styling
- Keep Greek translations for all user-facing text
- Do NOT change backend schema or routes unless absolutely necessary (debate routes already exist)
- All TypeScript must compile cleanly

## Commit Strategy

Commit each task separately:
1. `feat(ui): add AppShell, LifecycleStepper, and proposal status system`
2. `feat(ui): add proposal index page with filters and search`
3. `feat(ui): add debate UI with threads, voting, and integration`
4. `feat(ui): split dashboard — public landing vs authenticated workspace`
5. `feat(ui): display community type badges and admin panel`

Run `npx tsc --noEmit` after all tasks to verify compilation.
