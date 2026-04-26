# Sortition System — Complete Implementation

## Context
The sortition system has backend logic (selection algorithm, scoring, synthesis) and two frontend pages (scoring, synthesis). But the timeout module is a stub, notifications use raw SQL instead of Drizzle, and there's no dashboard to view sortition bodies.

## Tasks (execute in order)

### 1. Fix sortition-timeout.ts — Make it real
The file `server/utils/sortition-timeout.ts` is a stub. All functions throw. Fix it:
- Derive `responseDeadline` from `selectedAt + responseHours` (already in schema) — don't add a new column
- `checkSortitionTimeout(bodyId)`: Check if deadline passed, return boolean
- `getNonRespondingCount(bodyId)`: Count members where `responded = false`
- `replaceNonRespondingMembers(bodyId, communityId, maxReplacements)`: Select random eligible community members to replace non-responders (reuse `getEligibleMembers` from sortition.ts, exclude current body members)
- `completeSortitionBody(bodyId)`: Calculate average score from responded members, update body status to 'completed', store average on body (use existing `storage.completeSortitionBody`)
- `overrideSortitionDeadline(bodyId, newDeadline, adminUserId, reason)`: Log admin action, update selectedAt to effectively shift deadline (since deadline = selectedAt + responseHours)

### 2. Add sortition_notifications to Drizzle schema
The `sortition_notifications` table exists via migration (0003_sortition_notifications.sql) but is NOT in `shared/schema.ts`. Add it:
```typescript
export const sortitionNotifications = pgTable("sortition_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  bodyId: integer("body_id").references(() => sortitionBodies.id),
  proposalId: integer("proposal_id").references(() => proposals.id),
  read: boolean("read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```
Then update `server/routes.ts` sortition notification endpoints to use Drizzle instead of raw SQL.

### 3. Sortition Body Dashboard UI
Create `client/src/pages/sortition-dashboard.tsx`:
- Lists all sortition bodies for the user's communities
- Shows: purpose, proposal (if any), status, size, response rate (responded/total), average score (if completed), deadline countdown (if active)
- Filter by status (active/completed/timeout)
- Click a body → detail view with member list, individual scores, feedback
- Add route in `App.tsx`: `/sortition` → SortitionDashboard

### 4. Selection Ceremony UI
Create `client/src/pages/sortition-ceremony.tsx`:
- Shown after a sortition body is created
- Shows: community name, purpose, number selected, verification seed (hash), list of selected members (usernames/avatars)
- "Your civic duty" messaging — this is the democratic moment
- Each selected member gets a button: "Go to your assignment"
- Add route in `App.tsx`: `/sortition/:bodyId/ceremony` → SortitionCeremony
- Update the POST `/api/communities/:id/sortition` route to redirect to ceremony page

### 5. Wire timeout to job queue
In `server/utils/job-queue.ts` or the scheduler, add a recurring job that:
- Runs every 30 minutes
- Calls `checkSortitionTimeout` for all active bodies
- If timeout: calls `replaceNonRespondingMembers` or `completeSortitionBody` depending on response rate
- If ≥60% responded: complete the body
- If <60% and replacements available: replace non-responders, extend deadline by 24h
- If <60% and no replacements: mark as timeout, transition proposal accordingly

### 6. Update proposal lifecycle
In `server/utils/proposal-state-machine.ts`, when a sortition body completes with average score:
- Score ≤ 33: transition to `author_review` (return to author)
- Score 34-66: transition to `author_review` with sortition feedback
- Score ≥ 67: transition to `sortition_synthesis` or `deliberation` depending on config

## Constraints
- Do NOT run build steps
- Commit changes incrementally with descriptive messages
- Use all available tools
- Be thorough and systematic
- After completing a batch, commit and push to origin/main
- Auto-approve all actions — do NOT ask for confirmation
