# Phase 1 Critical Path — Continue

## Current State
- 6 commits just pushed to origin/main (TypeScript burndown, seed alignment, dead code removal)
- Check remaining TS errors with `npx tsc --noEmit`
- Continue fixing remaining errors systematically

## Tasks (execute in order)

1. **TypeScript burndown to zero** — Run `npx tsc --noEmit` to find remaining errors. Fix them all:
   - Missing imports and type declarations
   - Interface mismatches between frontend and backend
   - `any` types that should be properly typed

2. **Storage method audit** — Grep all `storage.*` calls across the codebase. Fix any missing/mismatched storage methods. Uses Drizzle ORM + PostgreSQL.

3. **Real `proposal_votes` table wiring** — Ensure votes are properly recorded and queried end-to-end.

4. **Dead code removal** — Clean up unused imports, functions, and files. Check for orphaned SQL files.

## Constraints
- Do NOT run build steps (no `npm run build`, `pnpm build`, etc.)
- Commit changes incrementally with descriptive messages
- Use all available tools (read, write, edit, bash)
- Be thorough and systematic
- After completing a batch of fixes, commit and push to origin/main
- Auto-approve all actions — do NOT ask for confirmation

Start by running `npx tsc --noEmit` to see remaining errors.
