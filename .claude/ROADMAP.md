# Phase 1 Critical Path

## Tasks (execute in order)

1. **TypeScript burndown to zero** — Fix all remaining TS errors systematically:
   - Missing imports and type declarations
   - Interface mismatches between frontend and backend
   - `any` types that should be properly typed

2. **Storage method audit** — Grep all `storage.*` calls. Fix missing/mismatched methods. Uses Drizzle ORM + PostgreSQL.

3. **Real `proposal_votes` table wiring** — Ensure votes are properly recorded and queried.

4. **Seed alignment** — Database seed data must align with canonical proposal lifecycle:
   draft → review → scoring → debate → vote → ratified/rejected

5. **Dead code removal** — Clean up unused imports, functions, and files.

## Constraints
- Do NOT run build steps (no `npm run build`, `pnpm build`, etc.)
- Commit changes incrementally with descriptive messages
- Use all available tools (read, write, edit, bash)
- Be thorough and systematic
- After completing a batch of fixes, commit and push to origin/main

Start with TypeScript burndown.
