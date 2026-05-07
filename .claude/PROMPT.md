# AgoraX Bug Fix Sprint — Complete Navigation & UI Audit

## Context
AgoraX is a deliberation democracy platform. Working copy: `/tmp/agoraxdemo`.
Tech stack: Express.js backend, React + Vite frontend, Drizzle ORM + PostgreSQL.
i18n: Use `useTranslation()` hook from `@/hooks/use-translation`, NOT `react-i18next` direct import.
All translation keys go in both `frontend/src/i18n/locales/en.ts` AND `frontend/src/i18n/locales/el.ts` — keep them in parity.

## Critical Bugs to Fix

### 1. BROKEN NAVIGATION (Highest Priority)
The dashboard page (`frontend/src/pages/dashboard.tsx`) uses `<button>` elements for navigation instead of `<Link>` components. Clicking "Submit Proposal", "Browse all proposals", and header nav links ("Proposals", "Communities") does nothing — no page transition.

**Fix:** Convert ALL navigation buttons across the app to use `<Link>` from `react-router-dom` or wire with `useNavigate()`. Check:
- `dashboard.tsx` — action buttons
- Header component — nav links
- Any other page with navigation buttons
- Footer links ("How it works", "FAQ", "Terms", "Privacy") — either wire to real pages or remove

### 2. BROKEN ROUTE: `/submit` Returns 404
The actual proposal creation route is `/proposals/new`. The `/submit` route doesn't exist. Either:
- Add a redirect from `/submit` → `/proposals/new`, OR
- Update all links pointing to `/submit` to use `/proposals/new`

### 3. PROFILE PAGE — Developer Placeholder Text
The profile page shows raw developer notes/placeholder text instead of a proper UI. Replace with a functional profile view showing user info, settings, etc.

### 4. SEARCH BAR — Non-functional Placeholder
The search bar in the header is a visual placeholder with no functionality. Either:
- Wire it to actually search proposals/communities, OR
- Hide it until search is implemented (cleaner for demo)

### 5. PLATFORM SETTINGS — "Failed to load" Error
After login, navigating to `/settings` shows "Failed to load platform settings." Check:
- Does the API endpoint `GET /api/platform-settings` exist in `server/routes.ts`?
- Does `DatabaseStorage` have `getPlatformSettings()` method?
- If missing, implement them.

### 6. SEED-DEMO.TS COLUMN MISMATCHES
The `server/seed-demo.ts` file has column name mismatches with the Drizzle schema:
- `password` → check actual column name in users table
- `description` → check communities table
- `role` → check users table
- `status` → check users table
Fix seed-demo.ts to match the actual schema in `server/db/schema.ts`.

### 7. FOOTER LINKS
Footer has links: "How it works", "FAQ", "Terms", "Privacy". These go nowhere. Options:
- Create simple static pages for them, OR
- Remove them from the footer, OR
- Make them no-ops with `href="#"` and `onClick={(e) => e.preventDefault()}`

## Quality Checklist
After fixing each item:
1. Run `npx tsc --noEmit` to verify TS compilation (ignore drizzle-orm node_modules errors)
2. Check i18n parity: all new keys in BOTH `en.ts` and `el.ts`
3. Verify the fix visually using browser screenshots if possible
4. Commit each fix with a descriptive message

## Conventions
- Use `@/hooks/use-translation` for i18n (NOT `react-i18next` direct import)
- Use `@/components/` for shared UI components
- Use `<Link>` from react-router-dom for all navigation
- Keep CSS consistent with existing Tailwind classes
- All new translation keys in both en.ts and el.ts
- Demo mode: `DEMO_MODE=true` — demo users work with any password

## Build Verification
After all fixes, verify with:
```
cd /tmp/agoraxdemo
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```
TS should be clean (excluding drizzle-orm external errors).
