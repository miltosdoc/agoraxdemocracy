# Phase 2 — Coherence Layer

## Current State
- Phase 1 complete: TS errors = 0, storage audited, proposal_votes wired, dead code removed
- All 8 lifecycle states covered in seed
- Clean git state, pushed to origin/main

## Tasks (execute in order)

1. **[DONE] Amendment merging logic** — ✅ Committed `7727ed7`. Includes amendment-similarity.ts (TF-IDF cosine similarity), updated amendment-merger.ts, integration test. Legacy survey scripts removed.

2. **[DONE] LLM validation integration** — ✅ Committed `348c884`. `/api/proposals/:id/submit` flows through canonical state machine (draft → review → author_review|draft), persists `llm_score`/`llm_feedback`. LLM client defaults to OpenRouter NVIDIA Nemotron free tier.

3. **[DONE] Proposal transition enforcement** — ✅ Committed `348c884`. `storage.transitionProposalState` rejects invalid transitions, exposed on `IStorage`.

4. **[DONE] Sortition body scoring UI** — ✅ Committed `1ce7d37`. Scoring endpoint uses `storage.updateSortitionMember`, validates score, persists feedback text via new `feedback` column + migration `0005_sortition_feedback.sql`.

5. **[DONE] Server-side dead code** — ✅ Committed `9368853`. Removed ~970 lines of dead `/api/polls`, `/api/surveys`, `/api/categories`, `/api/admin/update-poll-locations` routes, plus orphaned `update-poll-locations.ts` and boot-time call. Social-bot HTML preview at `/polls/:id` preserved.

6. **[DONE] Orphaned SQL files** — ✅ Committed `cb73a93`. Removed seed-all.sql, seed-proposals-fix.sql, seed-proposals.sql. seed_demo.sql remains (referenced by README + integration tests).

## Constraints
- Do NOT run build steps (no `npm run build`, `pnpm build`, etc.)
- Commit changes incrementally with descriptive messages
- Use all available tools (read, write, edit, bash)
- Be thorough and systematic
- After completing a batch of fixes, commit and push to origin/main
- Auto-approve all actions — do NOT ask for confirmation

## Phase 2 Complete ✅
All 6 tasks shipped. `tsc --noEmit` passes with zero errors. Pushed to origin/main.

## Phase 3 — Cleanup (Post-Phase 2)

1. **[DONE] Dead group schema** — Removed `groups` and `groupMembers` table definitions + Zod schemas from `shared/schema.ts`. Frontend i18n keys remain (dead strings, no components reference them). `/groups` redirect in App.tsx preserved for old bookmarks.
