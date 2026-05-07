# AgoraX Phase 3 — Coherence Layer Completion

You are working on `/tmp/agoraxdemo`, an AgoraX deliberation democracy platform. Express.js + Drizzle ORM + PostgreSQL. TypeScript.

## Context

The codebase has ~29K LOC, 167 files, 24 DB tables. Sortition system was completed in Phase 2. Now we're completing the Coherence Layer — the logic that makes deliberation actually work.

## Tasks (execute in order, commit after each)

---

### TASK 1: Amendment Similarity — Upgrade from Jaccard to TF-IDF + Cosine

**File:** `server/utils/amendment-similarity.ts`

The current implementation uses Jaccard similarity on normalized word sets. This is too naive — it doesn't weight terms by importance. Replace with TF-IDF + cosine similarity:

1. Implement `computeTFIDF(texts: string[]): number[][]` — builds a term frequency-inverse document frequency matrix from an array of amendment texts. Use the same `normalizeForSimilarity()` tokenizer as baseline, but weight by IDF.

2. Implement `cosineSimilarity(a: number[], b: number[]): number` — standard cosine similarity on two TF-IDF vectors.

3. Update `groupDuplicates()` to use TF-IDF + cosine instead of Jaccard. Keep the same interface (`DuplicateGroup[]` return type, `threshold` parameter). Default threshold stays 0.7.

4. Keep `normalizeForSimilarity()` exported (used elsewhere). Add the new functions as exports.

5. The `findDuplicateAmendments()` in `amendment-merger.ts` should continue working without changes — it imports from this module.

**Important:** Do NOT change the public API of `amendment-merger.ts`. Only upgrade the similarity algorithm inside `amendment-similarity.ts`.

---

### TASK 2: LLM Validation — Wire into Proposal State Machine

**Files:** `server/utils/llm-validation.ts` (exists), `server/utils/proposal-state-machine.ts` (exists), `server/utils/job-handlers.ts` (exists)

The LLM validation service exists and works (`validateProposal(question, solution)` returns `LLMValidationResult`). It's NOT wired into the proposal lifecycle. Wire it:

1. In `proposal-state-machine.ts`, add a new transition function `transitionToValidation(proposalId: number)` that:
   - Fetches the proposal from DB
   - Calls `validateProposal(question, solution)` from `llm-validation.ts`
   - Based on result.category:
     - `'return'` (score < 20): transition to `author_review` state, store validation result in `proposalValidation` table (or create a `validation_results` JSONB column on proposals if no table exists)
     - `'sortition'` (score 20-90): transition to `sortition` state, trigger sortition body creation
     - `'auto_approve'` (score > 90): transition to `voting` state
   - Store the full validation result (score, feedback, details) persistently

2. In `job-handlers.ts`, update the `structure_proposal` handler to call `validateProposal()` after structuring. If the result is `'return'`, notify the author. If `'sortition'`, enqueue a `create_sortition` job. If `'auto_approve'`, transition directly to voting.

3. Check if a `validation_results` table exists in the schema. If not, add one:
   ```typescript
   export const validationResults = pgTable("validation_results", {
     id: serial("id").primaryKey(),
     proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
     score: integer("score").notNull(),
     feedback: text("feedback"),
     details: jsonb("details"), // { structure, specificity, feasibility, completeness, clarity }
     category: text("category").notNull(), // 'return' | 'sortition' | 'auto_approve'
     validatedAt: timestamp("validated_at").notNull().defaultNow(),
   });
   ```
   Add to `drizzle` relations and update `server/db.ts` if needed.

---

### TASK 3: Live Debate System — Real-Time Discussion Surface

**Files:** Create `server/utils/debate.ts`, add schema to `shared/schema.ts`, add routes to `server/routes.ts`

The debate system allows real-time discussion on proposals during the deliberation phase. Implement:

1. **Schema** — Add to `shared/schema.ts`:
   ```typescript
   export const debateThreads = pgTable("debate_threads", {
     id: serial("id").primaryKey(),
     proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
     authorId: integer("author_id").notNull().references(() => users.id),
     parentId: integer("parent_id").references(() => debateThreads.id, { onDelete: "cascade" }), // null = top-level
     content: text("content").notNull(),
     upvotes: integer("upvotes").default(0),
     downvotes: integer("downvotes").default(0),
     createdAt: timestamp("created_at").notNull().defaultNow(),
     updatedAt: timestamp("updated_at").defaultNow(),
   });

   export const debateVotes = pgTable("debate_votes", {
     id: serial("id").primaryKey(),
     threadId: integer("thread_id").notNull().references(() => debateThreads.id, { onDelete: "cascade" }),
     userId: integer("user_id").notNull().references(() => users.id),
     direction: text("direction").notNull(), // 'up' | 'down'
     createdAt: timestamp("created_at").notNull().defaultNow(),
   });
   ```
   Add unique constraint on `(threadId, userId)` in debateVotes.

2. **Debate logic** — Create `server/utils/debate.ts`:
   - `createThread(proposalId, authorId, content)` — creates a top-level thread
   - `replyToThread(parentId, authorId, content)` — creates a child thread
   - `voteThread(threadId, userId, direction)` — upvote/downvote (toggle if already voted)
   - `getThreads(proposalId)` — returns all threads for a proposal, nested by parentId, sorted by upvotes
   - `getThreadStats(proposalId)` — returns { totalThreads, totalUpvotes, totalDownvotes, topContributors[] }

3. **Routes** — Add to `server/routes.ts`:
   - `POST /api/proposals/:id/debate` — create thread (body: { content, parentId? })
   - `GET /api/proposals/:id/debate` — get all threads
   - `POST /api/debate/:id/vote` — vote (body: { direction: 'up' | 'down' })
   - `GET /api/proposals/:id/debate/stats` — get stats

4. **Debate is only active during deliberation states** — `amendments`, `author_review`, `sortition`. Not during `voting` or after.

---

### TASK 4: Community System — Autonomous vs Managed + Default General Community

**Files:** `shared/schema.ts`, `server/seed-demo.ts`, `server/routes.ts`

The current community schema exists but lacks the autonomous/managed distinction. Update:

1. **Schema update** — Add to `communities` table in `shared/schema.ts`:
   ```typescript
   // Community type
   type: text("type").notNull().default("autonomous"), // 'autonomous' | 'managed'
   // For managed communities: admin IDs
   adminIds: jsonb("admin_ids").default("[]"), // array of user IDs
   // For autonomous: can transition to managed via proposal
   isGeneral: boolean("is_general").default(false), // the default instance-wide community
   ```

2. **Community transition logic** — Create `server/utils/community-manager.ts`:
   - `createCommunity(name, description, type, creatorId)` — creates a community
   - `transitionToManaged(communityId, adminIds)` — autonomous → managed (requires proposal vote)
   - `transitionToAutonomous(communityId)` — managed → autonomous (requires admin vote)
   - `addMember(communityId, userId)` / `removeMember(communityId, userId)`
   - `getCommunity(communityId)` — returns community with members and settings

3. **Default General Community** — In `server/seed-demo.ts`, seed a "General" community:
   - `type: 'managed'`, `isGeneral: true`
   - All demo users are members by default
   - Admin: the first demo user (miltos)
   - This is the catch-all community where all new users join automatically

4. **Platform Settings as Proposals** — In `server/seed-demo.ts`, seed default proposals in the General community that govern platform-wide settings:
   - "Minimum participation threshold" (default: 10%)
   - "Sortition body size" (default: 20)
   - "Proposal validation model" (default: NVIDIA Nemotron free)
   - "Amendment similarity threshold" (default: 0.7)
   These are proposals that can be voted on to change platform defaults. Store the current values in a `platform_settings` table:
   ```typescript
   export const platformSettings = pgTable("platform_settings", {
     id: serial("id").primaryKey(),
     key: text("key").notNull().unique(),
     value: text("value").notNull(),
     description: text("description"),
     lastChangedBy: integer("last_changed_by").references(() => users.id),
     lastChangedAt: timestamp("last_changed_at").defaultNow(),
   });
   ```

5. **User auto-enrollment** — When a new user registers, automatically add them to the General community. Hook this into the registration flow in `server/routes.ts`.

---

## Execution Rules

- Commit after each task with a descriptive message
- Do NOT run build steps — fix code only
- Use `tsc --noEmit` to verify TS compilation after each task
- All TS errors in `node_modules/` (drizzle-orm types) are pre-existing and expected — ignore them
- The `@shared/` path alias is handled by Vite at runtime — tsc will complain but it works
- Keep the existing API surface intact — add, don't break
- Write Greek comments in schema fields where appropriate (the codebase uses mixed Greek/English)

## Quality Bar

- Every new function has a JSDoc comment
- Error handling is explicit (no silent failures)
- DB queries use Drizzle's typed API (`db.query.X.findMany({ where: eq(...) })`)
- No `any` types unless absolutely unavoidable (with a comment explaining why)
