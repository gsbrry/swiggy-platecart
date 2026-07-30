# PlateCart

**Meal planning that fills your Instamart cart.**
Users pick weekly meal templates, PlateCart aggregates ingredients, and the Swiggy MCP pushes the shopping list straight into Instamart. Budget and food-waste tracking on the side.

Live demo: `http://localhost:3000` after running `npm run dev` (see [Run it locally](#run-it-locally)).

---

## Table of contents

1. [What this app is](#what-this-app-is)
2. [Tech stack](#tech-stack)
3. [Run it locally](#run-it-locally)
4. [Mock mode vs real mode](#mock-mode-vs-real-mode)
5. [Repository layout](#repository-layout)
6. [Routes and screens](#routes-and-screens)
7. [API surface](#api-surface)
8. [Data model](#data-model)
9. [Security](#security)
10. [What's done](#whats-done)
11. [What's pending](#whats-pending)
12. [Testing checklist for the Vercel team](#testing-checklist-for-the-vercel-team)
13. [Deployment](#deployment)
14. [Reference material](#reference-material)

---

## What this app is

PlateCart is a meal-planning + grocery-cart product for Indian home cooks. It solves three concrete pains:

| Pain | Feature |
|---|---|
| "What are we cooking this week?" | Weekly 7 × 3 meal-plan grid + a browsable library of 340+ home recipes |
| "Half the vegetables rot" | Waste log after each order cycle → over-buy patterns surface as nudges |
| "Where did ₹15k go?" | Budget ring, category split (groceries vs eat-out), weekly trend, transaction log |

The product is Phase 1 free — auth + planning + Instamart cart integration. Phase 2 (paid) adds regional voice via Sarvam AI, unlimited public templates, and premium analytics.

Full product spec: [`docs/architecture/arcchitecture_v5.html`](docs/architecture/arcchitecture_v5.html)

---

## Tech stack

| Layer | Tech | Version |
|---|---|---|
| Framework | Next.js App Router | 14.2 |
| Language | TypeScript (strict) | 5.6 |
| Styling | Tailwind CSS + shadcn/ui | 3.4 |
| Icons | lucide-react | 0.454 |
| Auth | Clerk (Google + Phone/OTP) | @clerk/nextjs 5.7 |
| Database | Neon Postgres (serverless HTTP driver) | 0.10 |
| ORM | Drizzle + drizzle-kit | 0.36 / 0.28 |
| Validation | Zod | 3.23 |
| Webhook verification | svix | 1.36 |
| Voice input (Phase 1) | Web Speech API (browser-native) | — |
| Grocery cart (Phase 1) | Swiggy MCP (server-side only) | stub |
| Hosting | Vercel | — |
| CI | GitHub Actions | see `.github/workflows/ci.yml` |

Package manager: **npm**. Node **20+**.

---

## Run it locally

**Quickest path — no external services needed:**

```bash
npm install
npm run dev
```

Open http://localhost:3000. You're now in **mock mode** (see next section). The landing page is at `/`, the demo dashboard at `/dashboard`, and `/sign-in` has a one-click "Log in as demo user" button.

**Scripts**

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server on :3000 |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | `next lint` (ESLint) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Drizzle: generate SQL migrations from `src/db/schema.ts` |
| `npm run db:migrate` | Drizzle: apply migrations to `DATABASE_URL` |
| `npm run db:studio` | Drizzle Studio (schema explorer) |

---

## Mock mode vs real mode

The app auto-detects which mode it's in based on env vars — **you do not need a flag**.

### Mock mode (default)

- **Trigger**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing
- **What happens**: Clerk is bypassed entirely, `getCurrentUser()` returns a demo user (`Raphy`, veg, budget ₹12,000, exclusions: onion + garlic), the dashboard reads mock data from `src/lib/mock.ts` instead of Drizzle, and API endpoints called from the UI (`/api/voice/parse`, `/api/cart/build`, `/api/cart/add-to-instamart`) return canned success responses.
- **Sign-in flow**: `/sign-in` shows a **one-click "Log in as demo user"** button (a real `<Link href="/dashboard">`), plus a pre-filled email/phone form that also lands on `/dashboard`.
- **Nothing is persisted.** Refresh loses any UI state changes.

### Real mode

- **Trigger**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
- **What happens**: Clerk middleware protects every route except `/`, `/sign-in/*`, `/sign-up/*`, `/api/auth/webhook`. `getCurrentUser()` resolves the internal `users` row from `auth().userId` (lazy-creating on first sign-in). Every Drizzle query is scoped to that user.
- **Required env** (see `.env.example`):
  ```
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
  CLERK_SECRET_KEY=sk_test_xxx
  CLERK_WEBHOOK_SECRET=whsec_xxx
  DATABASE_URL=postgresql://…?sslmode=require
  SWIGGY_MCP_API_KEY=…   # required in production
  ```
- **Migrations**: `npm run db:generate && npm run db:migrate` against your Neon `DATABASE_URL`.

### Clerk setup (for real mode)

1. Create a Clerk project. Enable Google + Phone/OTP under **Authentication**.
2. Copy Publishable + Secret keys into `.env.local`.
3. Add a webhook endpoint at `<your-domain>/api/auth/webhook`, subscribe to `user.created` + `user.updated`, and copy the signing secret to `CLERK_WEBHOOK_SECRET`.
4. Confirm the redirect URLs: `AFTER_SIGN_IN_URL=/dashboard`, `AFTER_SIGN_UP_URL=/onboarding` (already set in `.env.example`).

---

## Repository layout

```
src/
├── app/
│   ├── page.tsx                          Landing page (marketing)
│   ├── layout.tsx                        Root layout — ClerkProvider or shell
│   ├── globals.css                       Tailwind + CSS custom-property tokens
│   ├── dashboard/                        Screen 01 (protected)
│   ├── onboarding/                       Screen 02 — 5-step preferences flow
│   ├── meal-plan/                        Screen 03 — 7×3 grid
│   ├── templates/                        Screen 04 — browser
│   │   ├── [id]/                         Screen 05 — detail
│   │   └── new/                          Screen 06 — create
│   ├── my-templates/                     Screen 07
│   ├── cart/                             Screen 08 — Instamart preview
│   ├── budget/                           Screen 09 — tracker
│   ├── settings/                         Screen 10
│   ├── sign-in/[[...sign-in]]/           Clerk or mock sign-in
│   ├── sign-up/[[...sign-up]]/           Clerk or mock sign-up
│   └── api/
│       ├── auth/webhook/                 Clerk webhook (svix-verified)
│       ├── user/profile/                 GET, PATCH
│       ├── meal-plans/                   GET current, POST, PATCH slot
│       ├── templates/                    GET list, POST, GET one, POST fork
│       ├── cart/                         POST build, POST add-to-instamart
│       ├── voice/parse/                  POST voice transcript
│       ├── budget/summary/               GET month-to-date
│       └── waste/                        POST log, GET patterns
├── components/
│   ├── app-nav.tsx                       Shared top nav (client, usePathname)
│   ├── auth/                             MockSignInForm, MockSignUpForm
│   ├── dashboard/                        Hero, MealCards, WeekStrip, BudgetCard, StatsCard, VoiceButton
│   ├── onboarding/                       Multi-step flow
│   ├── meal-plan/                        Board, TemplatePicker
│   ├── templates/                        Browser, Detail, Create, mock lists
│   ├── my-templates/                     Browser + mock slice
│   ├── cart/                             CartView
│   └── settings/                         Form, ConfirmModal, constants
├── db/
│   ├── schema.ts                         Drizzle schema (7 tables, 5 enums, relations)
│   └── index.ts                          Lazy Neon HTTP client (Proxy)
├── lib/
│   ├── current-user.ts                   auth() → internal users row (mock-aware)
│   ├── mock.ts                           isMockMode + mock user/slots/budget/waste
│   ├── rate-limit.ts                     In-memory token bucket
│   ├── swiggy-mcp.ts                     Server-only MCP stub
│   ├── utils.ts                          cn() helper
│   └── validation/common.ts              Shared Zod schemas
└── middleware.ts                         Clerk (bypassed in mock) + security headers

docs/
├── architecture/arcchitecture_v5.html    Full product spec (source of truth)
├── screens/*.html                        Design mockups (S01–S06)
└── SCREENS.md                            Route ↔ API map

drizzle/                                  (gitignored) generated migrations
```

---

## Routes and screens

| Route | Screen | Public? | Notes |
|---|---|---|---|
| `/` | Landing | Yes | Marketing page — hero, features, testimonials, CTA |
| `/sign-in` | Auth | Yes | Mock form + one-click demo button, or real Clerk `<SignIn/>` |
| `/sign-up` | Auth | Yes | Mock form or Clerk `<SignUp/>` |
| `/dashboard` | 01 Dashboard | No | Today's meals, budget ring, week strip, waste nudge, voice FAB |
| `/onboarding` | 02 Onboarding | No | 5-step flow (goal, diet, household, budget, exclusions) with live preview |
| `/meal-plan` | 03 Meal Plan | No | 7×3 grid, template picker modal, nutrition + cart summary |
| `/templates` | 04 Templates | No | Search, filter chips, lane view + grid view |
| `/templates/[id]` | 05 Template Detail | No | Ingredients (1×/2×/4× toggle), steps, nutrition, fork modal, add-to-plan menu |
| `/templates/new` | 06 Create Template | No | Multi-section form + sticky live preview, localStorage draft |
| `/my-templates` | 07 My Templates | No | Created / Forked / All tabs, kebab menu |
| `/cart` | 08 Cart | No | Aggregated Instamart cart, by-meal or by-category grouping |
| `/budget` | 09 Budget | No | Ring, category bar, weekly trend, transactions, waste insights |
| `/settings` | 10 Settings | No | Profile, meal prefs, notification switches, delete-account modal |

Route ↔ API map: [`docs/SCREENS.md`](docs/SCREENS.md).

---

## API surface

All routes are Node runtime, all reads/writes filter by the internal `users.id` derived from Clerk (`// RLS: filter by userId` — grep for this to audit).

| Method | Path | Purpose | Rate limit |
|---|---|---|---|
| POST | `/api/auth/webhook` | Clerk webhook — upsert user on `user.created` | — |
| GET | `/api/user/profile` | Fetch current user | — |
| PATCH | `/api/user/profile` | Update goal / diet / budget / exclusions | — |
| GET | `/api/meal-plans/current` | This week's plan with slots + templates | — |
| POST | `/api/meal-plans` | Create weekly plan | — |
| PATCH | `/api/meal-plans/[id]/slots` | Assign/remove template in slot | — |
| GET | `/api/templates` | List public + own templates with filters | — |
| POST | `/api/templates` | Create template | — |
| GET | `/api/templates/[id]` | Detail + ingredients | — |
| POST | `/api/templates/[id]/fork` | Copy template into current user's library | — |
| POST | `/api/cart/build` | Aggregate ingredients from template ids | 10/min |
| POST | `/api/cart/add-to-instamart` | Send items to Swiggy MCP (server-only) | 10/min |
| POST | `/api/voice/parse` | Sanitize transcript → dish match | 20/min |
| GET | `/api/budget/summary` | Month-to-date spend by source | 100/min |
| POST | `/api/waste/log` | Log a waste event | — |
| GET | `/api/waste/patterns` | Ingredients over-bought 2+ times | — |

Public routes (unauthenticated): `/`, `/sign-in/*`, `/sign-up/*`, `/api/auth/webhook`. Everything else requires Clerk auth in real mode.

---

## Data model

Seven tables in `src/db/schema.ts` (Phase 1):

- **users** — `id`, `clerk_id`, `name`, `goal` (loss/gain/maintain), `diet_type` (veg/nonveg/vegan/keto/jain/glutenfree), `household_size`, `monthly_budget`, `eatout_per_week`, `exclusions[]`
- **templates** — `id`, `creator_id`, `forked_from_id`, `dish_name`, `tags[]`, `is_public`, `is_paid`, `price`, `fork_count`, `buy_count`
- **template_ingredients** — `id`, `template_id`, `ingredient_name`, `quantity`, `unit`, `instamart_search_hint`
- **meal_plans** — `id`, `user_id`, `week_start`
- **meal_plan_slots** — `id`, `meal_plan_id`, `day_of_week` (1–7), `meal_type`, `template_id`, `is_eatout`
- **orders_log** — `id`, `user_id`, `ordered_at`, `total_amount`, `source` (instamart/food), `template_ids[]`
- **waste_log** — `id`, `user_id`, `ingredient_name`, `waste_level` (none/some/most), `logged_at`

Relations wired for Drizzle's query builder. Phase 2 adds `follows` and `bookmarks`.

---

## Security

Configured centrally in `src/middleware.ts`:

- **Auth**: `clerkMiddleware` protects every non-public route.
- **CSP**: default-src self, script-src self + Clerk domains, connect-src self + Clerk + Neon, frame-ancestors none. Full policy in `src/middleware.ts`.
- **Other headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: microphone=(self)` (Web Speech API).
- **Input validation**: every write route uses Zod. Voice transcript sanitized to alphanumeric + space, capped at 200 chars.
- **Rate limits**: in-memory token bucket (`src/lib/rate-limit.ts`) — TODO comment marks the swap to Upstash Redis for production.
- **PII**: budget and order amounts are never logged raw — use masked values (`budget:present`).
- **Secrets**: `SWIGGY_MCP_API_KEY` is server-only, throws at init in production if unset.

Header check once deployed:
```bash
curl -I https://<your-preview>.vercel.app/ | grep -Ei "content-security|permissions|strict-transport|x-frame"
```

---

## What's done

### Frontend
- Landing page at `/` (hero, problem, how-it-works, features, testimonials, CTA, footer)
- All 10 product screens ported from the mockups (or built from spec where no mockup existed)
- Shared top nav with `usePathname`-driven active-tab detection
- Fully clickable UI — cards, tabs, chips, kebab menus, modals with focus trap + ESC
- Mock sign-in and sign-up forms; one-click "Log in as demo user" `<Link>` on `/sign-in`
- `loading.tsx` + `error.tsx` boundaries for the dashboard route
- Web Speech API integration on the voice FAB (mock mode returns canned matches)

### Backend
- 14 API endpoints stubbed with real auth guard + Zod validation + RLS pattern
- Cart build genuinely aggregates ingredients across templates
- Template fork copies template + ingredients under the current user + increments source `fork_count`
- Clerk webhook with svix signature verification
- Swiggy MCP client wrapper (server-only, stub `cartAdd` returning `{ok, order_ref}`)

### Infra
- Drizzle schema with all 7 Phase 1 tables + relations
- Lazy Neon HTTP client (so mock mode doesn't require `DATABASE_URL`)
- CI: lint + typecheck + build on every PR (Node 20)
- CSP + security headers + rate limits + input sanitization

### Dev experience
- **Mock mode** — the app boots and every screen is browsable with zero external services

---

## What's pending

### High priority — required for real (non-mock) usage
- [ ] Wire real Clerk keys and test the auth flow end-to-end (sign-up → onboarding → dashboard)
- [ ] Provision Neon + apply migrations; verify RLS via API smoke tests
- [ ] Real Swiggy MCP integration (currently stub in `src/lib/swiggy-mcp.ts`)
- [ ] Voice: hook `/api/voice/parse` up to a real templates search + fuzzy match
- [ ] Cart flow: verify `cart/build → cart/add-to-instamart` chain against a real MCP endpoint
- [ ] Onboarding PATCH `/api/user/profile` from the final step (mock mode currently only logs)
- [ ] Meal plan slot assignment via `PATCH /api/meal-plans/[id]/slots` (mock mode is local-state-only)

### Medium priority — quality and hardening
- [ ] Swap in-memory rate limiter for Upstash Redis (comment in `src/lib/rate-limit.ts`)
- [ ] Add Sentry + structured logging (with PII masking already spec'd)
- [ ] Add unit tests for validators, budget calc, waste-pattern detection
- [ ] Add integration tests for API routes (auth, RLS, cart build)
- [ ] Add Playwright E2E for the golden path (sign-up → onboarding → meal plan → cart → confirm)
- [ ] Regenerate the dashboard's `savedVsLastMonth` from real data (currently hardcoded `0`)
- [ ] Real image handling for template thumbnails (currently lucide icon on tinted block)

### Low priority — Phase 2 or later
- [ ] Sarvam AI voice for Hindi + regional languages
- [ ] Paid templates flow (`is_paid` + `price` columns exist; no purchase path)
- [ ] `follows` + `bookmarks` tables (spec'd, not created)
- [ ] Restock reminders (push notification / in-app / email — decide channel)
- [ ] Admin dashboard
- [ ] Mobile app (React Native — spec says "scales later")
- [ ] Auto-save meal plans as templates
- [ ] Public template moderation queue

### Nice-to-haves surfaced during the build
- [ ] Consolidate the mock sign-in and sign-up form field components (duplicated)
- [ ] Extract shared modal from ForkModal / ConfirmModal into a `<Dialog>` in `components/ui/`
- [ ] Real "similar templates" logic (currently: same meal_type, top 4 by fork_count)
- [ ] `budget/summary` route caching (spec mentions 60s edge cache + invalidate after order)
- [ ] Template thumbnail images (Vercel Blob or Cloudinary)

---

## Testing checklist for the Vercel team

### Mock mode (zero setup)
```bash
npm install
npm run dev
```
1. Visit `http://localhost:3000/` — landing renders, hero + all sections visible
2. Click **"See the demo"** → lands on `/dashboard` as Raphy
3. Or visit `/sign-in` → click **"Log in as demo user"** → `/dashboard`
4. Navigate every route via the top nav — Dashboard, Meal Plan, Templates, Budget, Settings
5. On Meal Plan, click an empty cell → template picker modal opens
6. On any template card → detail page, click Fork → confirmation modal
7. On Cart, click **Send to Instamart** → success screen with mock order ref

### Security surface
```bash
curl -I http://localhost:3000/ | grep -Ei "content-security|permissions|strict-transport|x-frame"
# expect: CSP, HSTS, X-Frame-Options: DENY, Permissions-Policy: microphone=(self)
```

### Auth guard (real mode only)
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/user/profile
# expect: 401
```

### Rate limits (real mode only, unauth is 401 first — sign in via cookie or use a valid Clerk session token)
```bash
for i in {1..25}; do curl -s -X POST http://localhost:3000/api/voice/parse -H "Content-Type: application/json" -d '{"transcript":"x"}' -o /dev/null -w "%{http_code} "; done
# expect: mostly 200, then 429 after 20
```

### DB migrations (real mode)
```bash
DATABASE_URL=... npm run db:generate
DATABASE_URL=... npm run db:migrate
```

### Typecheck + lint + build
```bash
npm run typecheck
npm run lint
npm run build
```

---

## Deployment

Vercel-native. The app deploys with zero config:

1. Import the repo into Vercel
2. Set env vars in the Project → Settings → Environment Variables (see `.env.example`)
3. Push to main → prod. Preview deployments happen automatically on PRs.
4. Neon: use a branch per environment (main → prod, `dev-*` → previews).

CI (`.github/workflows/ci.yml`) runs `lint → typecheck → build` on every PR. Fails the merge if any step is red.

---

## Reference material

- **Product spec**: [`docs/architecture/arcchitecture_v5.html`](docs/architecture/arcchitecture_v5.html) — full v5 architecture doc, source of truth
- **Screen mockups**: [`docs/screens/`](docs/screens/) — standalone HTML for S01–S06
- **Screen ↔ API map**: [`docs/SCREENS.md`](docs/SCREENS.md)
- **CI**: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
