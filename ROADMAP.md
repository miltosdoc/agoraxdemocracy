# AgoraX Roadmap

Updated: 2026-04-25

This roadmap separates **product capability** from **engineering maturity**. AgoraX already has a substantial prototype surface; the immediate priority is to make the repo and runtime trustworthy enough for serious review, demo, and team development.

## Current status

AgoraX is in **engineering-hardening phase**.

Working foundations:

- React/Vite frontend with Greek + English i18n.
- Express/TypeScript API.
- PostgreSQL 15 + Drizzle schema/migrations.
- Docker Compose stack: API, DB, ballot validation service.
- Demopolis proposal/community/sortition concepts represented in code.
- Gov.gr PDF ballot validation service exists as a Python/FastAPI microservice.
- Demo seed data exists.
- Basic API and ballot health endpoints exist.
- Initial engineering hygiene scripts now exist: i18n key check, unit test runner, Docker smoke check.

Known major gaps:

- `npm run check` is still red with hundreds of existing TypeScript errors.
- No GitHub Actions CI yet.
- Several UI pages still need shell/navigation consistency and complete i18n coverage.
- Runtime observability is still ad hoc.
- Security defaults are improved but need full production hardening.
- README/API docs still need ongoing verification against actual routes.

---

## Phase 0 — Engineering credibility baseline

Goal: make the repository look and behave like a real engineering team owns it.

### 0.1 Repo hygiene

Status: In progress

- [x] Remove duplicate `ballot_service/* 2.*` files.
- [x] Add `.hermes/` to `.gitignore`.
- [x] Replace hardcoded/local `start.sh` with portable starter.
- [x] Add `scripts/run_tests.sh`.
- [x] Add `scripts/check-i18n-keys.mjs`.
- [x] Add `scripts/smoke_docker.sh`.
- [ ] Add `.github/pull_request_template.md`.
- [ ] Add issue templates.
- [ ] Add `CHANGELOG.md`.

### 0.2 CI and tests

Status: Started

- [x] Wire `npm run test:unit` to Vitest.
- [x] Update state-machine tests to current v2 lifecycle.
- [x] Add ballot-client regression test for `form-data` constructor path.
- [x] Wire `npm run test:all`.
- [ ] Add GitHub Actions CI:
  - install
  - i18n check
  - unit tests
  - build
  - Docker build
  - Python ballot tests
- [ ] Make Python ballot tests run reliably in a local venv or CI job.
- [ ] Add API smoke tests.
- [ ] Add browser/UI smoke tests for primary routes.

### 0.3 TypeScript baseline

Status: Not green

- [ ] Make `npm run check` pass.
- [ ] Fix poll form type drift.
- [ ] Fix `server/storage.ts` / `IStorage` drift.
- [ ] Fix route-level `req.user` and storage method errors.
- [ ] Fix sortition/proposal schema mismatch.
- [ ] Fix Drizzle/session type issues.
- [ ] Gate CI on `npm run check` only after baseline is green.

### 0.4 Security baseline

Status: Started

- [x] Default `DEMO_MODE=false` in Docker Compose.
- [x] Require critical secrets in Compose.
- [x] Add runtime config validator.
- [x] Block demo mode when `APP_ENV=production`.
- [x] Sanitize auth responses with `SafeUser`.
- [ ] Add Helmet/security headers.
- [ ] Add session cookie hardening (`secure`, `sameSite`, environment-aware config).
- [ ] Validate OAuth `returnTo` redirects against same-origin paths.
- [ ] Add CORS allowlist for ballot service.
- [ ] Add max upload size for ballot PDFs.
- [ ] Triage `npm audit --omit=dev` findings.

### 0.5 Observability baseline

Status: Not started

- [ ] Add structured logger (`pino` or equivalent).
- [ ] Add request ID middleware.
- [ ] Stop logging response bodies by default.
- [ ] Redact cookies, auth headers, tokens, ballot identity material.
- [ ] Suppress/sample health check logs.
- [ ] Replace throw-after-response error handler.
- [ ] Split health endpoints:
  - `/health/live`
  - `/health/ready`
  - `/health/startup`
- [ ] Add build/version/commit metadata to health responses.

---

## Core architecture audit — 2026-04-25

The current codebase has many working pieces, but the app is not yet a coherent end-to-end deliberation product. The central issue is not lack of features; it is that several subsystems use different concepts for the same thing.

### Core flow target

The intended user journey should be:

1. User registers/logs in.
2. User joins or creates a community.
3. User creates a proposal inside a selected community.
4. Proposal enters a single lifecycle.
5. Community deliberates and proposes amendments.
6. Author reviews amendments.
7. Community signals on rejected amendments.
8. Sortition body synthesizes final text when needed.
9. Community performs final ratification vote.
10. Proposal is decided/archived with a public record.
11. Notifications and dashboards show each user what action is required.

### Current incoherences to resolve

#### 1. Proposal lifecycle is split across incompatible vocabularies

Current competing lifecycles:

- README/schema legacy lifecycle: `submitted → validating → valid/returned/rejected → scoring → under_review → amendments → debate → voting → resolved`
- submit route lifecycle: `draft → returned | approved | valid | validating`
- v2 state-machine lifecycle: `draft → review → author_review → community_signal → sortition_synthesis → voting → decided | archived`

Decision:

- Use the v2 lifecycle as canonical unless explicitly superseded:
  `draft → review → author_review → community_signal → sortition_synthesis → voting → decided | archived`.

Required work:

- [ ] Update README lifecycle text.
- [ ] Update schema comments.
- [ ] Update seed statuses.
- [ ] Rewrite `POST /api/proposals/:id/submit` to transition into v2 states.
- [ ] Ensure `POST /api/proposals/:id/transition` calls `triggerSideEffects`.
- [ ] Add API tests for all valid/invalid transitions.

#### 2. Communities and groups are conflated

Current state:

- `groups` and `group_members` still exist.
- `communities` and `community_members` exist.
- `polls` has `communityId`, but routes/components still reference `groupId`.
- Poll notifications depend on group semantics.

Decision required:

- Either migrate groups into communities, or keep groups as private poll-distribution lists with explicit `groupId` support.

Recommended decision:

- Communities are the primary civic unit.
- Groups become private poll-distribution lists only, or are removed from the main deliberation UX.

Required work:

- [ ] Decide groups vs communities.
- [ ] Fix `groupId`/`communityId` schema-route mismatch.
- [ ] Update navigation labels accordingly.
- [ ] Update access control accordingly.

#### 3. Proposal final voting is not a real final vote

Current state:

- Proposal detail uses `proposal_support` as “Vote”.
- `proposal_support` also represents deliberation support/oppose.
- No distinct final ratification ballot model exists.
- Unique constraint allows same user to both support and oppose because `type` is part of uniqueness.
- No quorum/finalization transition exists.

Required work:

- [ ] Add `proposal_votes` or equivalent final ratification table.
- [ ] Enforce one final vote per user/proposal.
- [ ] Check community membership and voting state.
- [ ] Add quorum/min-participation calculation.
- [ ] Add close/finalize endpoint.
- [ ] Transition `voting → decided` when vote completes.

#### 4. Frontend/backend contracts do not match

Examples:

- Community dashboard expects `memberCount`; community endpoint returns raw community.
- Proposal lists expect `title/state`; proposal model uses `question/status`.
- Proposal creation defaults to community `1` when no community is selected.
- Proposal cards render blank titles.

Required work:

- [ ] Define API DTOs for community cards, proposal cards, proposal detail, user task items.
- [ ] Stop exposing raw DB rows directly to UI.
- [ ] Make proposal creation require an explicit community.
- [ ] Add contract tests for seeded demo data rendering.

#### 5. Deliberation/amendment endpoints reference missing storage methods

Current issues:

- Routes call `storage.getAmendment`, but `DatabaseStorage`/`IStorage` do not expose it.
- Amendment submission lacks strict proposal-state checks.
- Rejected-amendment voting lacks community-membership checks.
- Rejection reason is not enforced.

Required work:

- [ ] Add `getAmendment` to storage or refactor routes to existing methods.
- [ ] Enforce amendment state windows.
- [ ] Enforce author-only review.
- [ ] Enforce community-member-only signal voting.
- [ ] Require rejection reason for rejection.

#### 6. Sortition is partly detached from proposals

Current issues:

- Manual sortition creation can create bodies without proposal linkage.
- State-machine side effects enqueue sortition but are not wired into route transitions.
- Sortition seed transparency is claimed but seed is not stored.
- Some sortition GET routes are too open.

Required work:

- [ ] Require/record proposal linkage for proposal sortition bodies.
- [ ] Store random seed or audit material if transparency is claimed.
- [ ] Wire state-machine side effects.
- [ ] Lock sortition body/member routes to eligible community/admin/assigned users.

#### 7. Notifications are split and partially outside Drizzle schema

Current state:

- Legacy poll notifications are in Drizzle schema.
- Sortition notifications/preferences are SQL migration tables but not Drizzle schema tables.
- Deadline reminder function exists but no scheduler wiring was identified.

Required work:

- [ ] Add notification tables to Drizzle schema.
- [ ] Replace raw SQL preference updates with typed queries.
- [ ] Wire proposal/sortition lifecycle notifications.
- [ ] Add scheduler or job runner for deadline reminders.

#### 8. UI flow has visible coherence breaks

Observed runtime issues:

- `/proposals` returns 404 even though proposals are central.
- Proposal cards show blank titles.
- Some proposal cards/calls-to-action do not navigate as expected.
- `/communities` lacks app shell/header/footer.
- `/proposals/:id` lacks app shell/header.
- Proposal detail status and default tab disagree (`sortition_synthesis` opens Vote tab).
- Debate/Sortition tabs did not switch reliably in browser dogfood pass.
- Multiple redundant Submit Proposal actions exist.

Required work:

- [ ] Add `/proposals` index route.
- [ ] Fix proposal card title/action rendering.
- [ ] Add shared app shell to all protected pages.
- [ ] Default proposal detail tab from proposal status.
- [ ] Fix Tabs interactions if reproducible.
- [ ] Consolidate CTAs into one Create action.

### Core architecture priority order

1. Canonical proposal lifecycle.
2. Schema/storage/route mismatch fixes.
3. Real proposal final vote model.
4. Community/group decision and migration path.
5. API DTO contract layer.
6. App shell/navigation coherence.
7. Notifications and admin audit integration.


---

## Phase 1 — UI coherence and trust

Goal: make the web/mobile app feel coherent, modern, and finished.

### 1.1 App shell and navigation

- [ ] Add shared `AppShell`, `PageShell`, `PageHeader`, `BackLink`, `EmptyState`, `LoadingState`.
- [ ] Ensure every protected page has consistent header/footer/bottom-nav spacing.
- [ ] Fix `/profile` blank page.
- [ ] Fix `/communities` missing shell.
- [ ] Fix `/proposals/:id` missing shell.
- [ ] Replace separate `New Poll` + `Submit Proposal` header buttons with one `Create` menu.
- [ ] Mobile create action should open a drawer/sheet, not a cramped dropdown.

### 1.2 Authenticated dashboard

- [ ] Split `/` public landing from `/home` authenticated dashboard.
- [ ] Dashboard should prioritize:
  - pending actions
  - active proposals
  - open votes
  - sortition assignments
  - communities
  - recent decisions

### 1.3 Proposal workspace

- [ ] Redesign proposal detail as lifecycle workspace.
- [ ] Add lifecycle stepper.
- [ ] Add next-action panel.
- [ ] Show final text, amendments, sortition, and vote/result coherently.
- [ ] Make mobile action sticky when action is required.

### 1.4 Community workspace

- [ ] Redesign community dashboard.
- [ ] Show lifecycle overview by proposal stage.
- [ ] Use localized governance labels instead of raw enum values.
- [ ] Clarify member count/proposal count rendering.
- [ ] Add community settings/governance panel if user is founder/admin.

### 1.5 i18n and terminology

- [x] Add i18n key scanner.
- [x] Add missing keys for major visible broken surfaces.
- [ ] Remove literal `t("English text")` usage or migrate to keys.
- [ ] Add typed translation keys or stricter scanner.
- [ ] Standardize user-facing Greek:
  - Proposal = Πρόταση
  - Amendment = Τροπολογία
  - Sortition body = Κληρωτό Σώμα
  - Community signal = Σήμα Κοινότητας
  - Ratification vote = Επικυρωτική Ψηφοφορία

---

## Phase 2 — Architecture cleanup

Goal: reduce the prototype-shaped backend into maintainable bounded contexts.

### 2.1 Backend structure

- [ ] Split `server/routes.ts` by domain:
  - auth
  - polls
  - proposals
  - communities
  - sortition
  - amendments
  - admin
  - ballot
- [ ] Split `server/storage.ts` into repositories.
- [ ] Add service layer for proposal lifecycle, sortition, ballot proxy, notifications.
- [ ] Centralize auth/authorization middleware.
- [ ] Centralize error handling.

### 2.2 API contracts

- [ ] Define DTOs for frontend/API boundaries.
- [ ] Stop leaking raw DB rows to the client.
- [ ] Add OpenAPI or generated API type contracts.
- [ ] Add response validation for high-risk routes.

### 2.3 Database/migrations

- [x] Add migration scripts in `package.json`.
- [ ] Document migration workflow.
- [ ] Add schema drift check.
- [ ] Add reset/seed scripts.
- [ ] Clarify seed file purpose and order.
- [ ] Ensure migrations match current schema.

---

## Phase 3 — Democracy model decisions

Goal: decide the unresolved governance questions before scaling.

High-priority product/governance decisions:

- [ ] Small community behavior below quorum thresholds.
- [ ] Exclusion/eligibility policy.
- [ ] Formal DPIA/GDPR plan for political opinion data.
- [ ] Initial growth strategy before quorum is reachable.
- [ ] Legal status of outcomes: advisory vs binding.
- [ ] Platform governance: who governs AgoraX itself?
- [ ] Groups vs Communities: merge, rename, or separate use cases.
- [ ] LLM role: structurer only vs any scoring/advisory role.
- [ ] Similar proposal merge workflow.
- [ ] Sortition timeout/replacement rules.

See `OPEN_QUESTIONS.md` for the detailed decision log.

---

## Phase 4 — Production hardening

Goal: prepare for external pilot use.

- [ ] Deploy staging with non-demo auth.
- [ ] Add CI/CD deploy workflow.
- [ ] Add backup/restore runbook.
- [ ] Add monitoring dashboards.
- [ ] Add alerting for API errors, DB health, ballot failures, queue failures.
- [ ] Add rate limits beyond auth endpoints.
- [ ] Complete security review.
- [ ] Complete DPIA.
- [ ] Document incident response.
- [ ] Document data retention/deletion.

---

## Phase 5 — Pilot readiness

Goal: make AgoraX usable by a real small community without developer supervision.

- [ ] Guided onboarding.
- [ ] Community creation wizard.
- [ ] Proposal creation wizard with examples.
- [ ] User task inbox.
- [ ] Notification preferences UI.
- [ ] Email/push notification delivery.
- [ ] Admin moderation tools.
- [ ] Public decision archive.
- [ ] Exportable deliberation/voting records.
- [ ] Accessibility pass.
- [ ] Mobile QA pass.

---

## Immediate next recommended PRs

1. **CI baseline**
   - Add GitHub Actions for build, i18n check, Vitest, smoke scripts.

2. **TypeScript burn-down: small safe fixes**
   - Fix obvious isolated TS errors first.
   - Avoid touching the giant poll form until dependencies/DTOs are understood.

3. **Observability baseline**
   - Add structured logs, request IDs, and safer error handler.

4. **UI shell fix**
   - Fix blank `/profile`, missing shell on `/communities`, missing shell on `/proposals/:id`.

5. **Roadmap/docs consolidation**
   - Move long API docs into `docs/API.md`.
   - Move ops content into `docs/OPERATIONS.md`.
   - Keep README short and accurate.
