# Developer Tasks & Sprint Plan

**Purpose:** a structured backlog that a developer — or an LLM coding agent — can pick up and execute against without re-reading the whole repo. Each task is self-contained: files to touch, acceptance criteria, exact API contract, and a ready-to-paste LLM prompt.

For product context (what the app is, tech stack, how to run) → [`README.md`](../README.md).
For the architecture source of truth → [`docs/architecture/arcchitecture_v5.html`](architecture/arcchitecture_v5.html).
For the screen ↔ API map → [`docs/SCREENS.md`](SCREENS.md).

---

## How to use this document with an LLM

1. Open a coding agent (Claude Code, Cursor, Codex) in the repo root.
2. Copy the task's **LLM Prompt** section verbatim into the agent.
3. The agent has enough context (files, acceptance criteria, links) to complete the task without human hand-holding.
4. When the task is done, run the **Verify** commands, tick the checkbox in this file, and commit with the suggested message.

### Ground rules for every task

- **Mock mode must keep working.** Every change should still let the app run with zero external services (see `src/lib/mock.ts`).
- **RLS everywhere.** Every DB query filters by the internal `users.id` derived from Clerk (`// RLS: filter by userId` — grep for this comment).
- **Validate at the boundary.** Every request body goes through Zod before touching the DB.
- **No new deps unless essential.** If you must add one, prefer tree-shakable, TypeScript-native libs.
- **TypeScript strict, no `any`.** If unavoidable, add a `// eslint-disable-next-line` with a reason.
- **Commit style:** conventional-commits-lite. `type(scope): subject` — one focused commit per task.

---

## Sprint overview

| Sprint | Goal | Tasks | Est. effort |
|---|---|---|---|
| **0** | Enable real (non-mock) mode | 4 | 1 dev · 2–3 days |
| **1** | Persist user actions end-to-end | 5 | 1 dev · 4–5 days |
| **2** | Real integrations (Swiggy, voice) | 4 | 1 dev · 3–4 days |
| **3** | Hardening — tests, rate-limits, observability | 6 | 1 dev · 5–6 days |
| **4** | UX polish (images, caching, similar templates) | 5 | 1 dev · 4 days |
| **5** | Phase 2 groundwork (paid templates, follows, bookmarks) | 4 | 1 dev · 4 days |

Sprints are independent past Sprint 0. Sprint 1 depends on Sprint 0. Sprints 2–5 can run in parallel once Sprint 1 lands.

---

## Sprint 0 — Enable real mode

Goal: switch off mock mode and run the app against Clerk + Neon + a real (still stubbed) MCP endpoint.

### 0.1 Provision Clerk and wire keys

- [ ] **Priority:** P0 (blocks everything else)
- **Effort:** 30 min
- **Files:** `.env.local` (create), Clerk dashboard
- **Acceptance:**
  - `.env.local` has `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
  - Visiting `/sign-in` shows the real Clerk `<SignIn/>` (not the mock form)
  - Sign-up with email/password redirects to `/onboarding`
  - `/dashboard` returns 200 with a Clerk session cookie and 401/redirect without
- **LLM Prompt:** (this task is human-only — API keys)

### 0.2 Provision Neon and run first migration

- [ ] **Priority:** P0
- **Effort:** 30 min
- **Files:** `.env.local`, `drizzle/` (generated), Neon dashboard
- **Acceptance:**
  - `DATABASE_URL` set in `.env.local` (pooled connection, `sslmode=require`)
  - `npm run db:generate` produces migration SQL in `drizzle/`
  - `npm run db:migrate` applies successfully
  - All 7 tables visible in Neon dashboard: `users, templates, template_ingredients, meal_plans, meal_plan_slots, orders_log, waste_log`
- **LLM Prompt:**
  > Run `npm run db:generate` against the current schema in `src/db/schema.ts`, then `npm run db:migrate` to apply. Report the list of tables created, any migration warnings, and confirm the enums (`goal`, `diet_type`, `meal_type`, `order_source`, `waste_level`) were created. Do NOT edit the schema.

### 0.3 Wire the Clerk webhook end-to-end

- [ ] **Priority:** P0
- **Effort:** 1 hour
- **Files:** `src/app/api/auth/webhook/route.ts` (already written; verify)
- **Acceptance:**
  - Clerk webhook endpoint points at `<deploy-url>/api/auth/webhook`
  - Subscribed to `user.created` + `user.updated`
  - Test sign-up creates a row in `users` with the correct `clerk_id`
  - Sending an unsigned request returns 401
- **LLM Prompt:**
  > Read `src/app/api/auth/webhook/route.ts`. Confirm the svix signature check is enforced and the `user.created` path upserts a row into `users`. Add a unit test in `src/app/api/auth/webhook/route.test.ts` that mocks svix + drizzle and asserts: (1) missing `svix-signature` returns 401, (2) valid `user.created` payload calls `db.insert(users).values({ clerkId, name })`, (3) unrelated event types return 200 no-op. Use vitest or node:test — pick whichever the project already has (check package.json first).

### 0.4 Add a `dashboard` smoke test that hits real DB

- [ ] **Priority:** P0
- **Effort:** 30 min
- **Files:** new `scripts/smoke.sh` or `.github/workflows/preview-smoke.yml`
- **Acceptance:**
  - A shell script that, given `BASE_URL` + a valid Clerk session cookie, verifies:
    - `GET /` → 200
    - `GET /api/user/profile` (unauth) → 401
    - `GET /api/user/profile` (auth) → 200 with a valid `users` row
    - `GET /dashboard` (auth) → 200 with `<title>PlateCart</title>` in HTML
- **LLM Prompt:**
  > Create `scripts/smoke.sh` that takes `BASE_URL` (default http://localhost:3000) and `CLERK_SESSION_COOKIE` env vars and runs the 4 checks above. Exit 0 on all pass, 1 on any fail. Print status per check. Add a matching GitHub Actions job to `.github/workflows/ci.yml` that runs it against `http://localhost:3000` (skip cookie-required checks in CI unless a test Clerk session is available).

---

## Sprint 1 — Persist user actions

Goal: every screen's write action reaches the DB — no more UI-only state.

### 1.1 Onboarding: persist profile on completion

- [ ] **Priority:** P1
- **Effort:** 2 hours
- **Files:**
  - `src/components/onboarding/onboarding-flow.tsx` — replace `console.log("[mock] payload")` with `fetch('/api/user/profile', { method: 'PATCH', ... })`
  - Verify `src/app/api/user/profile/route.ts` accepts the payload shape
- **Acceptance:**
  - Completing onboarding in real mode PATCHes `/api/user/profile` with `{ goal, diet_type, household_size, monthly_budget, eatout_per_week, exclusions }`
  - On 200, `router.push('/dashboard')`
  - On error, inline banner with retry option
  - Mock mode still no-op logs (do NOT break it)
- **LLM Prompt:**
  > Open `src/components/onboarding/onboarding-flow.tsx`. Find the `finish()` handler. Currently in mock mode it does `console.log` then `router.push('/dashboard')`. In real mode (`!isMockMode()`), it should PATCH `/api/user/profile` with the collected state, await the response, and only push on 200. On error, set an error string in state and render a small red banner above the CTA row with a "Try again" button. Import `isMockMode` from `@/lib/mock`. Payload shape (see `src/app/api/user/profile/route.ts` `patchSchema`):
  > ```ts
  > { goal, diet_type, household_size, monthly_budget, eatout_per_week, exclusions }
  > ```
  > Add a small `<ErrorBanner>` inline component in the same file. Verify with `npm run typecheck` and by running through onboarding in mock mode (should still work).

### 1.2 Meal plan: persist slot assignments

- [ ] **Priority:** P1
- **Effort:** 3 hours
- **Files:**
  - `src/components/meal-plan/meal-plan-board.tsx` — the slot mutation handler
  - `src/app/api/meal-plans/[id]/slots/route.ts` — already implemented; verify it accepts the payload
  - `src/app/api/meal-plans/route.ts` — used to create the initial plan if none exists
- **Acceptance:**
  - Opening `/meal-plan` in real mode fetches or creates the current week's `meal_plans` row
  - Assigning a template to a cell PATCHes `/api/meal-plans/[id]/slots`
  - Removing a template sends `templateId: null`, marking eat-out sends `is_eatout: true`
  - The picker filters templates by user preferences (diet, exclusions) — call `GET /api/templates?diet=veg&exclude=onion`
- **LLM Prompt:**
  > Wire `src/components/meal-plan/meal-plan-board.tsx` to the real API. Currently the picker's onSelect callback only updates local state. In real mode:
  > 1. On mount, if `planRow` is null, POST `/api/meal-plans` with `{ week_start: weekStartIso }` and use the returned id.
  > 2. When a cell is assigned/cleared, PATCH `/api/meal-plans/[planId]/slots` with `{ day_of_week, meal_type, template_id, is_eatout }`. Optimistic update the local grid; roll back on error with a toast.
  > 3. The template picker's list should hit `GET /api/templates?diet=<user.dietType>&limit=20` on open, filter locally by search text, plus include the eat-out synthetic option.
  > Keep mock mode intact via `isMockMode()` guard — mock still uses local state.

### 1.3 Cart: persist order in `orders_log` after Instamart send

- [ ] **Priority:** P1
- **Effort:** 2 hours
- **Files:**
  - `src/app/api/cart/add-to-instamart/route.ts` — after successful MCP call, insert into `orders_log`
  - `src/components/cart/cart-view.tsx` — verify the flow triggers the write
- **Acceptance:**
  - Sending an Instamart cart in real mode writes an `orders_log` row: `{ user_id, ordered_at, total_amount, source: 'instamart', template_ids }`
  - `total_amount` comes from the cart's estimated total (sum of item prices)
  - Dashboard's budget ring immediately reflects the new spend on next load
- **LLM Prompt:**
  > Extend `src/app/api/cart/add-to-instamart/route.ts` to accept an additional field in the request body: `{ items, template_ids, total_amount }`. Validate with Zod (uuid[] for template_ids, non-negative number for total_amount). After the `swiggyMcp.cartAdd()` call succeeds and NOT in mock mode, insert a row into `orders_log` with the current userId, ordered_at=now, total_amount, source='instamart', template_ids. Update `src/components/cart/cart-view.tsx` to send the extra fields. Confirm via a DB query: `SELECT * FROM orders_log WHERE user_id = <id> ORDER BY ordered_at DESC LIMIT 1;`

### 1.4 Waste log: post from the dashboard nudge

- [ ] **Priority:** P2
- **Effort:** 2 hours
- **Files:**
  - `src/components/dashboard/stats-card.tsx` — add a "Log waste" action next to the nudge
  - `src/app/api/waste/log/route.ts` — already implemented
- **Acceptance:**
  - Dashboard waste nudge has a small "Log this cycle" button
  - Clicking opens a mini form: for each over-bought ingredient, pick `none / some / most`
  - Submitting POSTs one `/api/waste/log` per ingredient with the chosen level
  - After submit, refresh the page → nudge disappears (or updates)
- **LLM Prompt:**
  > In `src/components/dashboard/stats-card.tsx`, next to the waste-pattern text, add a "Log this cycle" secondary button that opens a small inline drawer (not a modal) below the card. The drawer lists each pattern ingredient with three radio pills: `none / some / most`. A submit button POSTs one `/api/waste/log` request per ingredient with `{ ingredient_name, waste_level }`, in parallel. On all-success, close the drawer and `router.refresh()`. Handle partial failures with a toast listing which ones failed. Mock mode: still show the drawer, but the POSTs return mock success (already wired in the API route).

### 1.5 Template creation: verify Publish writes to DB

- [ ] **Priority:** P1
- **Effort:** 1 hour
- **Files:**
  - `src/components/templates/new/template-form.tsx` — verify real-mode POST path
  - `src/app/api/templates/route.ts` — POST handler
- **Acceptance:**
  - Publishing a new template in real mode inserts a row into `templates` + N rows into `template_ingredients`
  - On success, `router.push('/my-templates')` shows the new template
  - Mock mode: still `console.log` + navigate
- **LLM Prompt:**
  > Read `src/components/templates/new/template-form.tsx` and `src/app/api/templates/route.ts`. Confirm the POST body shape matches the form's payload. If the API route hasn't been fully implemented for insertions, add: (1) insert template row with `creator_id = user.id`, `is_public = form.visibility === 'public'`; (2) bulk-insert `template_ingredients` rows in a Drizzle transaction; (3) return `{ id }`. The form should already POST when `!isMockMode()`. Add a real-mode E2E: publish → GET `/api/templates?creator_id=me` includes the new id.

---

## Sprint 2 — Real integrations

### 2.1 Real Swiggy MCP integration

- [ ] **Priority:** P1
- **Effort:** 4 hours (once Swiggy provides real MCP endpoint)
- **Files:** `src/lib/swiggy-mcp.ts`
- **Acceptance:**
  - `cartAdd({ items })` calls the actual MCP endpoint with `Authorization: Bearer ${SWIGGY_MCP_API_KEY}`
  - Handles the real response schema (order id, status, unavailable items)
  - Retries on transient failures (5xx, network), max 2 retries, exponential backoff
  - Timeouts at 10 s
- **LLM Prompt:**
  > Replace the stub in `src/lib/swiggy-mcp.ts`'s `cartAdd`. Use `fetch(BASE_URL + '/cart/add', { method: 'POST', headers: { Authorization, Content-Type }, body: JSON.stringify({ items }) })` with an `AbortController` set to 10 s. On 5xx or network error, retry twice with exponential backoff (500 ms, 2 s). Return `{ ok, order_ref, unavailable_items? }` where `unavailable_items` is any items Instamart couldn't fulfil. Keep the SERVER-ONLY warning comment. Keep the dev/prod key-check behaviour (`throw` in prod if missing, warn + stub in dev).

### 2.2 Voice: real template match

- [ ] **Priority:** P2
- **Effort:** 3 hours
- **Files:**
  - `src/app/api/voice/parse/route.ts`
  - Consider: a `templates_search_view` or Postgres full-text index
- **Acceptance:**
  - Voice endpoint returns real matches from the DB, not stubs
  - Uses Postgres `to_tsvector` on `dish_name || ' ' || tags` for fuzzy match
  - Top 5 results ordered by rank
  - Respects the user's diet + exclusions
- **LLM Prompt:**
  > In `src/app/api/voice/parse/route.ts`, replace the stub template_matches return with a real Drizzle query. Use raw `sql` for `to_tsvector('english', dish_name) @@ plainto_tsquery('english', ${sanitized})` with a rank sort. Add a Drizzle migration that creates a GIN index on `to_tsvector('english', dish_name || ' ' || coalesce(array_to_string(tags, ' '), ''))`. Filter results by the user's `diet_type` (join on `templates.tags`). Limit 5. Keep the mock-mode branch returning canned matches.

### 2.3 Templates listing: replace mock with real API in `/templates` and `/my-templates`

- [ ] **Priority:** P1
- **Effort:** 2 hours
- **Files:**
  - `src/components/templates/template-browser.tsx`
  - `src/components/my-templates/my-templates-browser.tsx`
- **Acceptance:**
  - Both browsers fetch from `GET /api/templates` (with `creator_id=me` for `/my-templates`)
  - Lane view: separate calls per lane, staggered load
  - Search: debounced 300 ms, hits `/api/templates?q=<term>`
  - Filter chips: append `&diet=`, `&goal=`, etc.
  - Fall back to mock array when `isMockMode()`
- **LLM Prompt:**
  > Both browsers currently render from a local mock array. Refactor to: on mount (`useEffect`), if `!mockMode`, fetch templates. Split into two hooks: `useTemplatesLane(lane)` and `useTemplatesGrid({ q, filter })`. Debounce the grid search input at 300 ms. Show skeleton cards while loading. Keep the mock array as a fallback when in mock mode. Do not add SWR or React Query — plain `useEffect` + `useState` + `AbortController`. Update `template-browser.tsx` and `my-templates-browser.tsx`. Types come from the existing `BrowserTemplate` + `MineTemplate`.

### 2.4 Budget summary: real month-to-date

- [ ] **Priority:** P2
- **Effort:** 2 hours
- **Files:**
  - `src/app/api/budget/summary/route.ts` — verify aggregation is correct
  - `src/app/budget/page.tsx` — replace mock arrays with API call
- **Acceptance:**
  - `/budget` renders real month-to-date data
  - Weekly trend is derived from `orders_log` grouped by week
  - Recent transactions list = last 10 rows of `orders_log` for the current user
  - Empty state: "No spend yet this month"
- **LLM Prompt:**
  > `src/app/api/budget/summary/route.ts` currently returns `{ monthly_budget, spent_groceries, spent_eatout, remaining }`. Extend it to also return `{ weekly_trend: [{ week: 'W1'|'W2'|..., groceries, eatout }], recent_transactions: [{ id, ordered_at, source, total_amount, template_hint }] }`. Update `src/app/budget/page.tsx` — currently reads from `mockBudget`. In real mode, fetch this endpoint server-side. The `template_hint` is the first template's `dish_name` from `template_ids[0]` — join through `templates`. Keep mock mode's static data.

---

## Sprint 3 — Hardening

### 3.1 Swap in-memory rate limiter for Upstash Redis

- [ ] **Priority:** P1
- **Effort:** 2 hours
- **Files:** `src/lib/rate-limit.ts`, `package.json` (`@upstash/ratelimit`, `@upstash/redis`)
- **Acceptance:**
  - `@upstash/ratelimit` + `@upstash/redis` installed
  - `checkRateLimit(userId, bucket, limit)` uses sliding-window Redis
  - Env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - Falls back to in-memory when Redis creds absent (dev-friendly)
- **LLM Prompt:**
  > Refactor `src/lib/rate-limit.ts`. Add `@upstash/ratelimit` and `@upstash/redis` as deps. Export `checkRateLimit(userId, bucket, limitPerMin)` that: (1) if `UPSTASH_REDIS_REST_URL` is set, uses Upstash sliding-window limiter with a 60-second window; (2) otherwise falls back to the existing in-memory token bucket. Cache the `Ratelimit` instance per bucket. Update `.env.example` with the two new vars. Verify all callers (grep for `checkRateLimit`) still compile.

### 3.2 Add Sentry for error + PII-masked logging

- [ ] **Priority:** P2
- **Effort:** 3 hours
- **Files:** `sentry.client.config.ts`, `sentry.server.config.ts`, `next.config.mjs`, `package.json`
- **Acceptance:**
  - `@sentry/nextjs` initialised for client + server
  - `beforeSend` scrubs `total_amount`, `monthly_budget`, `email`, `phone`, `exclusions[]` from event payloads
  - Test error at `/api/debug/error` (dev only) is captured
- **LLM Prompt:**
  > Add `@sentry/nextjs` following the official Next 14 App Router setup. Create `sentry.client.config.ts` + `sentry.server.config.ts` with `dsn: process.env.NEXT_PUBLIC_SENTRY_DSN`. Add a `beforeSend` on both that strips or masks fields matching `/monthly_budget|total_amount|email|phone|exclusions/` from `event.extra` and `event.contexts`. Run `npx @sentry/wizard@latest -i nextjs` if it makes sense, otherwise do it manually. Add `.env.example` entries: `NEXT_PUBLIC_SENTRY_DSN=`, `SENTRY_AUTH_TOKEN=`.

### 3.3 Unit tests for validators + core lib

- [ ] **Priority:** P1
- **Effort:** 4 hours
- **Files:** `src/lib/validation/common.test.ts`, `src/lib/rate-limit.test.ts`, `src/db/index.test.ts` (mock env)
- **Acceptance:**
  - Vitest or node:test runs green
  - Coverage: `common.ts`, `rate-limit.ts`, `current-user.ts` mock-mode branch, `mock.ts` helpers
  - CI runs the test step
- **LLM Prompt:**
  > Add Vitest to the project (`npm i -D vitest @vitest/coverage-v8`). Add `test` and `test:coverage` scripts. Create tests for:
  > 1. `src/lib/validation/common.ts` — every exported schema (uuid, isoDate, safeText, enums) passes valid inputs, rejects invalid.
  > 2. `src/lib/rate-limit.ts` — 3 hits of the same bucket succeed within limit, 11th hit fails when limit=10, buckets are isolated by userId.
  > 3. `src/lib/current-user.ts` — in mock mode returns `mockUser`, in real mode with no `clerkId` returns null (mock `auth()` to return null).
  > 4. `src/lib/mock.ts` — `mockSlots()` returns 21 slots, `mockTodaySlots()` filters to today's dayOfWeek.
  > Wire the CI to run `npm test`.

### 3.4 Integration tests for API routes

- [ ] **Priority:** P1
- **Effort:** 5 hours
- **Files:** `src/app/api/**/route.test.ts`
- **Acceptance:**
  - Every write route has a test for: 401 unauthenticated, 400 invalid body, 200 happy path, RLS (user A can't touch user B's data)
  - Uses `next-test-api-route-handler` OR a lightweight fetch-against-dev-server approach
  - Runs in CI against a test Neon branch
- **LLM Prompt:**
  > Add integration tests for each write route in `src/app/api/**/route.ts`. Use Vitest. Mock Clerk's `auth()` per test via `vi.mock('@clerk/nextjs/server', ...)`. For DB assertions, use a real Neon test branch (`DATABASE_URL_TEST`). Per route, cover: (1) unauthenticated → 401, (2) authed but invalid body → 400, (3) authed + valid → 200 with expected side effect, (4) authed as user B trying to touch user A's row → 404 or 403. Focus on: `user/profile PATCH`, `meal-plans POST`, `meal-plans/[id]/slots PATCH`, `templates POST`, `templates/[id]/fork POST`, `cart/build POST`, `waste/log POST`.

### 3.5 Playwright E2E for the golden path

- [ ] **Priority:** P2
- **Effort:** 4 hours
- **Files:** `tests/e2e/golden.spec.ts`, `playwright.config.ts`
- **Acceptance:**
  - Playwright installed + configured
  - Test runs against `npm run dev` in mock mode
  - Golden path: landing → sign-in as demo → onboarding (skip) → dashboard → meal-plan (assign a template) → cart (send to Instamart) → success screen
  - Runs in CI
- **LLM Prompt:**
  > Install Playwright (`npm init playwright@latest`). Config: chromium only, headless in CI, headed locally, baseURL from `PLAYWRIGHT_BASE_URL` (default localhost:3000). Write `tests/e2e/golden.spec.ts` that runs the golden path listed in the acceptance criteria — start at `/`, click "Log in as demo user", assert `/dashboard` renders, click "Meal Plan", click any empty cell → picker opens, pick the first template, close picker, click "Add to Instamart" if visible or go to `/cart` → "Send to Instamart" → assert success screen with order ref. Add a `test:e2e` script.

### 3.6 Observability: request logging middleware

- [ ] **Priority:** P2
- **Effort:** 2 hours
- **Files:** `src/middleware.ts`, `src/lib/log.ts` (new)
- **Acceptance:**
  - Every request logs: method, path, status, duration ms, userId (or "anon")
  - Structured JSON to stdout (Vercel picks up)
  - Never logs raw budget/order amounts
- **LLM Prompt:**
  > Create `src/lib/log.ts` that exports `log.info({ msg, ...fields })` printing JSON to stdout. Add a `withLog` wrapper in `src/middleware.ts` that captures start time, calls the response, logs `{ method, path, status, ms, userId: 'anon' | maskedClerkId }` after. Ensure no keys named `total_amount`, `monthly_budget`, `email`, `phone` are ever passed to `log.info` (use a `redact()` helper). Update the middleware default export to wrap both mock-mode and clerk-mode paths.

---

## Sprint 4 — UX polish

### 4.1 Template thumbnail images

- [ ] **Priority:** P2
- **Effort:** 3 hours
- **Files:** `src/db/schema.ts` (add `thumbnail_url text`), `src/components/templates/**`, Vercel Blob or Cloudinary integration
- **Acceptance:**
  - `templates.thumbnail_url text` column added via migration
  - Template create form has a drag-drop upload area
  - Uploads go to Vercel Blob (`@vercel/blob`), URL saved to DB
  - All template cards render `<Image>` when `thumbnail_url` present, fallback to lucide `Utensils` block
- **LLM Prompt:**
  > Add `thumbnail_url text` (nullable) to the `templates` table via a new Drizzle migration. Add `@vercel/blob` dependency. Create `src/lib/upload.ts` with an `uploadThumbnail(file)` helper. Add a drag-drop upload area to `src/components/templates/new/template-form.tsx` above the Basics section. Update every place that renders a template card (`template-browser.tsx`, `my-templates-browser.tsx`, `template-detail.tsx`, dashboard `meal-cards.tsx`, meal-plan grid cells) to use `<Image src={thumbnail_url} ... />` when present. Use Next `<Image>` with proper sizes. Add `images.remotePatterns` entry for the Blob domain in `next.config.mjs`.

### 4.2 Budget summary edge caching

- [ ] **Priority:** P3
- **Effort:** 1 hour
- **Files:** `src/app/api/budget/summary/route.ts`
- **Acceptance:**
  - `Cache-Control: private, max-age=60` on the response
  - After a `POST /api/cart/add-to-instamart`, next `GET /api/budget/summary` returns fresh data (invalidation)
  - Use Next 14 `revalidateTag('budget-summary')` from the mutation
- **LLM Prompt:**
  > Add `Cache-Control: private, max-age=60` header to the response in `src/app/api/budget/summary/route.ts`. Tag the fetch with `budget-summary-<userId>`. In `src/app/api/cart/add-to-instamart/route.ts` and `src/app/api/waste/log/route.ts`, call `revalidateTag('budget-summary-' + user.id)` after the write. Verify the client sees fresh data by looking at response headers (`age`, `x-vercel-cache`).

### 4.3 Real "similar templates" logic

- [ ] **Priority:** P3
- **Effort:** 2 hours
- **Files:** `src/app/api/templates/[id]/route.ts` — return `similar` array
- **Acceptance:**
  - Detail response includes `similar: BrowserTemplate[]` (top 4)
  - Ranking: same `meal_type` (60% weight) + shared tags (30%) + high `fork_count` (10%)
  - Excludes the current template
  - `src/components/templates/detail/template-detail.tsx` uses the API-provided list
- **LLM Prompt:**
  > Extend `src/app/api/templates/[id]/route.ts` to include a `similar` field. Compute similarity in SQL: for each other public template, score = 0.6 * (same meal_type ? 1 : 0) + 0.3 * (shared_tags_count / max_tags) + 0.1 * min(fork_count, 100)/100. Return top 4. Alternative: fetch candidates in JS, score there. Update `template-detail.tsx` to use the response's `similar` instead of the current in-file logic. Verify types: `similar: Array<{ id, dishName, tags, kcal, prepMinutes, forkCount, difficulty, lane, mealType }>`.

### 4.4 Dashboard: "Saved vs last month" real value

- [ ] **Priority:** P3
- **Effort:** 1 hour
- **Files:** `src/app/dashboard/page.tsx`
- **Acceptance:**
  - `savedVsLastMonth` computed from `orders_log`: `last_month_total - this_month_total`
  - Positive = saved (show green +₹X), negative = overspend (show red -₹X)
- **LLM Prompt:**
  > In `src/app/dashboard/page.tsx`, replace the hardcoded `savedVsLastMonth = 0`. Add a fifth Drizzle query in the parallel block: sum `orders_log.total_amount` where `ordered_at >= <first day of last month>` and `< monthStart`. Compute `saved = lastMonthSum - thisMonthSum`. Pass to `<StatsCard>`. Update `stats-card.tsx` to render green when saved > 0, red when < 0.

### 4.5 Consolidate mock forms + shared Dialog

- [ ] **Priority:** P3
- **Effort:** 2 hours
- **Files:**
  - `src/components/ui/dialog.tsx` (new, shadcn-style)
  - `src/components/ui/field.tsx` (new, extracted from mock forms)
  - Refactor `mock-sign-in-form.tsx`, `mock-sign-up-form.tsx`, `template-detail.tsx` (ForkModal), `settings/confirm-modal.tsx`
- **Acceptance:**
  - Single `<Dialog>` component with focus trap, ESC, backdrop click, aria-modal
  - Single `<Field>` component with label + input
  - All existing modals refactored to use it
  - No visual regressions
- **LLM Prompt:**
  > Extract a `Dialog` component to `src/components/ui/dialog.tsx` matching shadcn's Dialog API (`<Dialog open onOpenChange>`, `<DialogContent>`, `<DialogTitle>`). Focus trap + ESC + backdrop click already in the existing modals — port that logic. Extract a `Field` component to `src/components/ui/field.tsx` from the identical implementations in `mock-sign-in-form.tsx` and `mock-sign-up-form.tsx`. Refactor callers: fork modal in `template-detail.tsx` and `confirm-modal.tsx` in settings. Verify all modals still open/close correctly and no styling regressed.

---

## Sprint 5 — Phase 2 groundwork

### 5.1 `follows` table + follow/unfollow endpoints

- [ ] **Priority:** P3 (Phase 2)
- **Effort:** 2 hours
- **Files:** `src/db/schema.ts`, `src/app/api/follows/route.ts` (new)
- **Acceptance:**
  - New `follows` table: `follower_id uuid`, `following_id uuid`, `created_at`, unique on `(follower_id, following_id)`
  - `POST /api/follows { user_id }` → add follow
  - `DELETE /api/follows { user_id }` → remove
  - `GET /api/follows` → list of users the current user follows
- **LLM Prompt:**
  > Add a `follows` table to `src/db/schema.ts` with the shape above + a self-referential Drizzle relation. Run `db:generate` to produce the migration. Create `src/app/api/follows/route.ts` with POST/DELETE/GET handlers, all Zod-validated + RLS. Add a unit test covering: (1) can't follow yourself, (2) duplicate follow is idempotent, (3) delete of non-existent follow returns 404.

### 5.2 `bookmarks` table + save/unsave templates

- [ ] **Priority:** P3
- **Effort:** 2 hours
- **Files:** `src/db/schema.ts`, `src/app/api/bookmarks/route.ts` (new), `src/components/templates/detail/template-detail.tsx`
- **Acceptance:**
  - `bookmarks` table: `user_id`, `template_id`, `created_at`, unique on `(user_id, template_id)`
  - POST/DELETE on `/api/bookmarks`
  - Template detail page has a bookmark icon toggle
- **LLM Prompt:**
  > Add `bookmarks` table and endpoints, mirror the pattern in 5.1. Add a bookmark button to `src/components/templates/detail/template-detail.tsx` (bookmark icon, filled when bookmarked). State fetched via a small `GET /api/bookmarks?template_id=X` head request or included in the template detail response.

### 5.3 Paid templates: `is_paid` + `price` UI + purchase flow (skeleton)

- [ ] **Priority:** P3
- **Effort:** 4 hours
- **Files:** `src/components/templates/new/template-form.tsx` (add price input when private→paid toggle), Razorpay integration (skeleton)
- **Acceptance:**
  - Create form has an "Is this a paid template?" toggle → shows price input
  - Detail page shows a "Buy for ₹X" button when `is_paid && creator_id !== current_user.id && !bookmarked`
  - Purchase endpoint stub: `POST /api/templates/[id]/buy` → returns 501 for now
- **LLM Prompt:**
  > Add the paid-template UI: (1) in `template-form.tsx`, when Visibility = private, show a follow-up "Charge for this template?" switch; when on, show a price input (₹1 – ₹500, step 10). (2) In `template-detail.tsx`, show a "Buy for ₹X" button when the template is paid and the current user is not the creator; on click, POST to `/api/templates/[id]/buy` and show a "Payment coming soon" toast for now. (3) Create the buy route returning 501. Payment gateway integration (Razorpay recommended for India) is out of scope for this task — leave a TODO comment with the required flow.

### 5.4 Sarvam AI voice provider swap

- [ ] **Priority:** P3
- **Effort:** 4 hours
- **Files:** `src/components/dashboard/voice-button.tsx`, new `src/lib/voice-provider.ts`
- **Acceptance:**
  - Abstract voice input behind a `VoiceProvider` interface with `start()` and `stop()`
  - Web Speech API is the default provider
  - `SarvamProvider` (record → POST to `/api/voice/transcribe`) is available when `NEXT_PUBLIC_VOICE_PROVIDER=sarvam`
  - New route `POST /api/voice/transcribe` proxies audio blob to Sarvam and returns text
- **LLM Prompt:**
  > Create `src/lib/voice-provider.ts` with a `VoiceProvider` interface `{ start(onResult): void, stop(): void }`. Implement `WebSpeechProvider` (extract from current `voice-button.tsx`) and `SarvamProvider` (records audio to a Blob, POSTs to `/api/voice/transcribe`, resolves with `onResult(text)`). Factory: return sarvam if `process.env.NEXT_PUBLIC_VOICE_PROVIDER === 'sarvam'`, else web-speech. Update `voice-button.tsx` to use the factory. Create `src/app/api/voice/transcribe/route.ts` that receives `multipart/form-data` with `audio.wav` and forwards to Sarvam AI's STT endpoint (env: `SARVAM_API_KEY`, `SARVAM_STT_URL`); return `{ transcript }`. Stub the actual Sarvam call if the API details aren't finalised — return the placeholder `{ transcript: '' }` and add a TODO.

---

## Fast-path — the 5 tasks the Vercel team should complete first

If time is tight, land these five in order:

1. **0.1** — Clerk keys (human, 30 min) — unblocks everything
2. **0.2** — Neon + first migration (30 min)
3. **1.1** — Onboarding PATCH profile (2 h) — proves the write path works end-to-end
4. **1.3** — Cart writes `orders_log` (2 h) — proves the mutation → dashboard read loop
5. **3.1** — Upstash rate limiter (2 h) — production readiness

That's ~1 dev-day of work and gets the app from "browsable demo" to "production-ready core loop verified."

---

## Notes for LLM agents working through this list

- Before any task, run `git status` — the working tree should be clean.
- Run `npm run typecheck && npm run lint` before committing.
- Verify mock mode still works after every task (`unset NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && npm run dev`).
- If a task's file paths look wrong, grep the codebase — the repo may have moved things.
- Never widen the surface: don't add API routes not listed here without discussion. Every new endpoint needs matching auth + RLS + Zod + rate-limit consideration.
- Every commit: single-topic. Format: `type(scope): subject`. No co-author trailer.

---

**Last updated:** 2026-07-30
**Owner:** Raphy Varghese (@gsbrry)
**Repo:** github.com/gsbrry/swiggy-platecart
