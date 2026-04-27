# Phase 6: Platform Settings, Community Badges, Attendance Tracking

## Context
AgoraX deliberation democracy platform. Working copy: `/tmp/agoraxdemo`.
Branch: `main`. TS compilation clean. Git clean tree.

## Task 1: Platform Settings Page

Create a new page at `/settings` that displays and allows editing of platform-wide settings.

**Backend (server/routes.ts):**
Add these routes:
- `GET /api/platform-settings` — List all platform settings
- `PUT /api/platform-settings/:key` — Update a setting value `{ value: string }`

**Storage (server/storage.ts):**
Add methods:
- `getPlatformSettings(): Promise<PlatformSetting[]>`
- `updatePlatformSetting(key: string, value: string, userId: number): Promise<PlatformSetting>`

**Frontend (client/src/pages/platform-settings.tsx):**
Create a settings page with:
- AppShell layout
- Settings grouped by category: General, Deliberation, Voting, Sortition, Amendments
- Each setting: Label, description, input field (text/number/boolean), save button
- Default settings to display:
  - `default_sortition_size` (number, default 20)
  - `default_min_participation_pct` (number, default 10)
  - `default_sortition_response_hours` (number, default 72)
  - `default_amendment_threshold` (number, default 0.5)
  - `default_max_amendments_per_proposal` (number, default -1 for unlimited)
  - `llm_model` (text, default "nvidia/nemotron-3-nano-30b-a3b:free")
  - `llm_api_url` (text, default "https://openrouter.ai/api/v1")
- Toast on save success/failure
- i18n keys for all labels (en/el)

**Route (client/src/App.tsx):**
Add: `<ProtectedRoute path="/settings" component={PlatformSettingsPage} />`

## Task 2: Community Type Badges

Update the community-list component (`client/src/components/community/community-list.tsx`) to display community type badges:
- **Autonomous** — green badge with 🌐 icon
- **Managed** — blue badge with 👥 icon
- Show governance model next to type badge
- Use existing Badge component from shadcn/ui
- i18n keys: `community.type.autonomous`, `community.type.managed`

## Task 3: Attendance Tracking System

**Backend Schema (shared/schema.ts):**
Add table:
```typescript
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  communityId: integer("community_id").notNull().references(() => communities.id),
  date: date("date").notNull(),
  activityType: text("activity_type").notNull(), // 'vote' | 'debate' | 'sortition' | 'proposal' | 'amendment'
  proposalId: integer("proposal_id").references(() => proposals.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

**Backend Routes (server/routes.ts):**
- `GET /api/communities/:id/attendance` — Get attendance for a community (date range params)
- `POST /api/attendance` — Record attendance event
- `GET /api/users/:id/attendance` — Get user's attendance history

**Storage (server/storage.ts):**
- `getCommunityAttendance(communityId, startDate?, endDate?): Promise<Attendance[]>`
- `recordAttendance(userId, communityId, activityType, proposalId?): Promise<Attendance>`
- `getUserAttendance(userId, communityId?, startDate?, endDate?): Promise<Attendance[]>`

**Frontend (client/src/pages/attendance.tsx):**
- AppShell layout
- Date range picker
- Attendance table: user, date, activity type, proposal
- Summary stats: total activities, unique active days, most active users
- i18n keys (en/el)

**Route (client/src/App.tsx):**
Add: `<ProtectedRoute path="/communities/:id/attendance" component={AttendancePage} />`

## Constraints
- All i18n keys in both en.ts and el.ts
- Use existing AppShell layout
- Use existing shadcn/ui components (Card, Badge, Button, Input, Select, Table)
- Follow existing code patterns (api client, useTranslation hook, etc.)
- TS compilation must be clean (0 errors)
- No build steps — fix code only

## Quality Bar
- All components use AppShell layout
- All text uses t() for i18n
- Error handling with toast notifications
- Loading states with spinners
- Follow existing patterns from community-settings.tsx and proposal-detail.tsx