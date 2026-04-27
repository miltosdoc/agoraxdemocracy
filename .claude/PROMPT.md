# AgoraX Bug Fix Sprint — Critical Issues

## Context
Working copy: `/tmp/agoraxdemo`. Docker compose running with `DEMO_MODE=true`. API on port 3000, DB on 5432.

## CRITICAL BUGS TO FIX

### 1. Migration Journal Missing Entries
The `migrations/meta/_journal.json` only lists migration 0000. All other migrations (0001-0009) exist as SQL files but are NOT in the journal, so `drizzle-kit migrate` skips them. This causes:
- Missing `jobs` table (migration 0001)
- Missing `final_text` column on proposals (migration 0002)
- Missing `admin_ids`/`is_general` on communities (migration 0008)
- Missing `sortition_attendance` table (migration 0009)

**Fix:** Update `_journal.json` to include all 10 migration entries (0000-0009). Also fix the duplicate `0003` prefix — rename `0003_sortition_notifications.sql` to `0003b_sortition_notifications.sql` and `0003_canonical_proposal_lifecycle.sql` to `0003a_canonical_proposal_lifecycle.sql`. Update journal tags accordingly.

### 2. Seed Script Crashes
The seed script (`server/seed-demo.ts`) crashes after creating users because the DB schema is incomplete (missing columns from unapplied migrations). Once migrations are fixed, the seed should work. But also add error handling so the container starts even if seeding fails.

### 3. Navigation Buttons Don't Navigate
In `client/src/components/Header.tsx`, navigation buttons use `<button>` elements instead of `<Link>` components. Clicking them doesn't navigate.

**Fix:** Replace `<button onClick={() => navigate(...)}>` with `<Link to="...">` using React Router's Link component.

### 4. Platform Settings Page Fails
`/settings` shows "Failed to load settings" because the `platform_settings` table doesn't exist (migration 0008 not applied). Once migrations are fixed, this should work. But also add a fallback to create default settings if the table is empty.

### 5. Profile Page Has Developer Notes
`client/src/pages/profile.tsx` contains placeholder text like "TODO: Add user stats" and "FIXME: Wire up notifications". Replace with proper user-facing content.

### 6. Empty States Need CTAs
When there are no proposals, communities, or notifications, show proper empty states with call-to-action buttons instead of blank pages.

### 7. Settings Page Uses Spinbuttons Instead of Toggles
Boolean settings in `/settings` use number inputs (spinbuttons) instead of toggle switches. Convert to proper toggle UI.

## IMPLEMENTATION ORDER

1. **Fix migrations first** — update journal, rename duplicate 0003 files
2. **Fix seed script** — ensure it works with complete schema
3. **Fix navigation** — replace buttons with Links in Header
4. **Fix settings page** — ensure platform_settings loads or creates defaults
5. **Fix profile page** — replace dev notes with proper UI
6. **Add empty states** — proposals, communities, notifications pages
7. **Fix settings toggles** — boolean inputs as toggles

## CONSTRAINTS
- Use `@/hooks/use-translation` for i18n (not direct react-i18next import)
- Keep i18n parity between en.ts and el.ts
- Demo mode: any password works for seeded users
- Rate limiter disabled in demo mode
- Docker build must pass

## AFTER FIXES
Rebuild Docker containers and verify all pages load without errors.
