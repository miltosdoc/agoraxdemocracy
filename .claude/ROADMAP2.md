# Phase 2 — Coherence Layer

## Current State
- Phase 1 complete: TS errors = 0, storage audited, proposal_votes wired, dead code removed
- All 8 lifecycle states covered in seed
- Clean git state, pushed to origin/main

## Tasks (execute in order)

1. **Amendment merging logic** — When multiple amendments target the same proposal, implement merge/dedup logic. Amendments with overlapping text should be consolidated or flagged for author review.

2. **LLM validation integration** — Wire the proposal review step to call the LLM validation endpoint. Proposals in `review` state should be scored and feedback stored in `llm_score` / `llm_feedback` columns. Use the openrouter free model configured for AgoraX.

3. **Proposal transition enforcement** — Ensure `transitionProposalState` validates against `VALID_PROPOSAL_TRANSITIONS` from `shared/proposal-lifecycle.ts`. Block invalid transitions (e.g., draft → voting).

4. **Sortition body scoring UI** — The sortition scoring page (`/sortition/:id`) needs to actually submit scores to the backend. Wire up the scoring form to `storage.updateSortitionMember`.

5. **Server-side dead code** — Remove poll-related routes from `server/routes.ts` that are no longer needed (poll creation, survey routes, poll results endpoints). Keep the HTML preview route for social bots if still useful.

6. **Orphaned SQL files** — Clean up `seed-proposals.sql`, `seed-proposals-fix.sql`, `seed-all.sql`, `seed_demo.sql` if they're superseded by `server/seed-demo.ts`.

## Constraints
- Do NOT run build steps (no `npm run build`, `pnpm build`, etc.)
- Commit changes incrementally with descriptive messages
- Use all available tools (read, write, edit, bash)
- Be thorough and systematic
- After completing a batch of fixes, commit and push to origin/main
- Auto-approve all actions — do NOT ask for confirmation

Start with amendment merging logic.
