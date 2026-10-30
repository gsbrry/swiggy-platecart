# Review 05: QA, performance, accessibility, and India payments compliance

> Reviewer roles: (a) QA/test, performance and accessibility lead, (b) payments and compliance advisor for India.
> Read with [`ROADMAP.md`](../ROADMAP.md) and [`BACKLOG.md`](../BACKLOG.md). Status as of Oct 2026.
> Part B is not legal or tax advice. Every item marked **[verify with a CA/lawyer]** must be confirmed before money moves.

---

## TL;DR

1. There are **no tests and no test tooling** today: no `test` script, no Vitest, no Playwright. CI runs lint, typecheck and build only. Add a test pyramid before Phase 2 replaces the mock reads, because that phase is where most regressions will come from.
2. **Mock mode is a test asset.** Keep it as the fixture layer for unit and component tests and for a fast E2E smoke run. Run the real golden paths against a disposable database.
3. **Glass costs a lot on low-end Android.** The codebase has about 112 `backdrop-blur`/`.glass` usages, and every assigned cell in the weekly grid has its own `backdrop-blur-md`. Cap blur to 2 or 3 layers on screen and give the grid cells a solid fill.
4. **The appetite colours fail contrast.** White text on `#FF8A1F` measures 2.36:1 and on `#F26419` 3.18:1. Orange `#F26419` text on white is also 3.18:1. All of these are below the 4.5:1 that WCAG AA requires for normal text.
5. **Payments:** do not collect money into your own bank account and then pay creators yourself. Use **Razorpay Route** (a marketplace split handled by a licensed payment aggregator), or sell only platform-owned menus until Route is approved.
6. **Free-first is correct.** Even the free marketplace needs Terms, a Privacy notice (DPDP), a grievance officer, health disclaimers and review moderation, because the app hosts user content.

---

# Part A: QA

## A1. Current state (what I checked)

| Item | Finding |
|---|---|
| `package.json` | Scripts are `lint`, `typecheck`, `build` and `db:*`. There is no `test`, `test:e2e`, or `format:check`. No Vitest, Testing Library, Playwright, or axe dependencies. |
| `.github/workflows/ci.yml` | One `verify` job: `npm ci`, then lint, typecheck and build. No tests, no `permissions`, no `concurrency`, no timeout, no migration check, no bundle budget. |
| CI build env | It sets `CLERK_PUBLISHABLE_KEY`, but mock mode keys off **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`** (`src/lib/mock.ts:10`). CI therefore always builds in mock mode, so the real-auth code path is never compiled with the flag on. That can be fine, but it should be intentional (see A6). |
| `src/lib/rate-limit.ts` | In-memory and per-instance, so tests must not assume it holds across requests in serverless (TX.1). |
| Weekly grid (`meal-plan-board.tsx`) | Has `role="grid"`, labelled cells, arrow-key navigation and Enter/Space to open the picker. **But every cell has `tabIndex={0}`** (21+ tab stops), and there is no roving tabindex, no Home/End, and no `aria-selected`. |
| Template picker | Has a focus trap, Esc to close, focus returned on close, and `aria-modal`. Good. Keep it as the pattern for every modal. |

## A2. Test strategy for v1

A pyramid with mock mode as the cheap base:

| Layer | Tool | Runs against | Target | When |
|---|---|---|---|---|
| Unit | **Vitest** (+ `@vitest/coverage-v8`) | Pure functions | 80% lines on `src/lib/**` and validators | Every PR, < 30 s |
| Component | Vitest + `@testing-library/react` + `jsdom`, `vitest-axe` | Mock data from `src/lib/mock.ts` | Key interactive components | Every PR |
| Integration (API + DB) | Vitest (node env), calling route handlers directly | **Supabase local test DB** (`supabase start` in Docker), or a Neon branch if Clerk + Neon stays | Every API route: happy path, 401, 403 (other user's row), 400 (Zod) | Every PR (service container) |
| E2E | **Playwright** + `@axe-core/playwright` | `next build && next start`. Smoke in mock mode; golden paths with a real DB and a Clerk test user | List in A3 | PR: smoke. Main/nightly: full suite against preview |
| Performance | Lighthouse CI + `@next/bundle-analyzer` | Production build, mobile emulation | Budgets in A5 | PR (bundle), nightly (LHCI) |

### Unit tests (Vitest): what to cover first

- `src/lib/validation/common.ts` and every Zod schema at the API edges: valid input, missing fields, wrong types, oversize strings, negative or huge amounts.
- Date and week helpers (`formatWeekLabel`, week start, "Copy last week"). Pin `TZ=Asia/Kolkata` in tests **and** run once with `TZ=UTC`. IST is UTC+5:30, so off-by-one-day bugs around midnight are the most likely class here.
- Shopping-list merge (T1.2): the same ingredient in different units, quantity rounding, and dedupe across meals.
- Budget math (T1.4/T2.12): month boundaries, "saved vs last month", and paise as integers (never floats).
- Marketplace (Phase 4): average rating recalculation, the rule that only buyers can rate, price formatting (₹, inclusive of GST), platform-fee split rounding (paise; the total must reconcile exactly).
- Razorpay signature verification (T4.10): a fixture payload with a known secret, a tampered body, and a replayed event id.
- `checkRateLimit`: inject a clock and test refill.

### Integration tests (Supabase test DB)

- **Setup:** `supabase start` (local Postgres in Docker) or a Postgres service container. Apply migrations from scratch on every run. A seed script creates two users, A and B. Wrap each test in a transaction and roll it back, or truncate between files.
- **Auth:** stub `current-user.ts` (or the Supabase session) to return A or B. Do not mock the DB.
- **Key assertions:**
  - **Tenant isolation:** user B gets 403/404 on every read, update and delete of user A's plan, slot, template, expense or review. This is the single most important integration suite, because the ground rule "every query filtered by `users.id`" is easy to break. If Supabase is chosen, also test **RLS policies** directly with the `anon` and `authenticated` roles.
  - Fork/copy creates new rows owned by the caller and never mutates the source.
  - Account deletion cascades every user row (T2.11/T2.14), including reviews (or anonymises them, per the policy chosen in Part B).
  - Ratings: a unique constraint per (user, menu), and a non-buyer is rejected. Ten concurrent rating inserts produce the correct average (transaction, T4.6).
  - Payment webhook: the same `payment.captured` twice produces exactly one `menu_purchases` row (idempotency key = `razorpay_payment_id`). The amount comes from the DB, never from the client.
  - Webhook signature: the Clerk/svix webhook is rejected with a bad signature (T2.14).
- **Migration check:** `drizzle-kit generate` produces no diff against the committed `drizzle/` folder (T2.5).

## A3. E2E scenarios (Playwright), exact list

Run on two projects: **Desktop Chrome** and **Pixel 5** (mobile, 393 px). Run the `@a11y` tag with axe on every page visited.

**Smoke (every PR, mock mode, no secrets, < 2 min)**

1. `E2E-01` Landing page loads, has no Swiggy/Instamart copy (after T1.6), and the primary CTA navigates to sign-in.
2. `E2E-02` Demo login, then `/dashboard` renders today's meals, budget card and week strip, with no console errors.
3. `E2E-03` Every top-level route returns 200 and passes axe with no serious or critical violations: `/dashboard`, `/meal-plan`, `/templates`, `/templates/[id]`, `/templates/new`, `/my-templates`, `/budget`, `/settings`, `/onboarding`, `/shopping-list`.

**Golden paths (main + nightly, real DB + Clerk test user)**

4. `E2E-10` **Sign up → onboarding → dashboard.** A new user signs up with a Clerk test email (`+clerk_test` address, code `424242`), completes onboarding (diet, household size, budget), and lands on `/dashboard`. The profile is persisted.
5. `E2E-11` **Plan a week.** On `/meal-plan`, add 3 meals with the mouse and 1 meal **with the keyboard only** (arrow to a cell, Enter, type in search, Enter). Remove one meal and move one meal. Reload the page and the state persists.
6. `E2E-12` **Copy last week / Auto-fill week**, then confirm the slot count and that no slots are duplicated.
7. `E2E-13` **Shopping list.** Generate it for the week, confirm the merged quantities, check off 2 items, and confirm "Copy" puts the expected text on the clipboard (grant clipboard permission). The WhatsApp fallback link has the encoded text.
8. `E2E-14` **Budget.** Add an expense (groceries, ₹250), the budget ring updates, switch month, then switch back.
9. `E2E-15` **Persistence across sessions.** Sign out, sign back in, and the plan, list check state and expense are still there (T2.17).
10. `E2E-16` **Templates.** Browse, filter (veg), open a detail page, fork it, and it appears under `/my-templates` → Forked. Create a new template and it appears under Created.
11. `E2E-17` **Settings → delete account.** The confirm modal traps focus. After deleting, sign-in with the same user shows no data.
12. `E2E-18` **Isolation via UI.** User B opens user A's private plan URL and sees 404, not A's data.

**Phase 3 and 4 additions**

13. `E2E-20` Share a plan, open `/p/[slug]` logged out (read-only, OG meta present), log in as B, "Copy to my week".
14. `E2E-21` **Free menu:** publish a Week menu, a second user clicks "Get menu" and applies it from a start date, and the calendar is filled.
15. `E2E-22` **Rating:** a buyer rates 4★ with text and the average updates. A non-buyer sees no rate button, and the API returns 403. A second rating by the same user edits the first rather than adding one.
16. `E2E-23` **Report and moderate:** report a review, an admin hides it, and it disappears from the public page.
17. `E2E-24` **Paid menu (Razorpay test mode):** checkout with test UPI success, wait for the webhook, and the purchase is applied. Then the failure path: payment failed, nothing is granted. Then a replayed webhook still produces a single purchase.
18. `E2E-25` **Refund:** an admin refunds a test payment, access is revoked (or kept, per policy), and the creator earnings reverse.

Conventions: `data-testid` only where no accessible role or name exists (prefer `getByRole`). One test user per worker. A global teardown deletes test users. Collect traces on first retry, `retries: 1` in CI, and keep a flake budget of 0 (quarantine with a tag and an issue).

## A4. CI gates and suggested `ci.yml`

Required checks to merge to `main`:

| Gate | Command | Blocking |
|---|---|---|
| Lint | `npm run lint` (`next lint`; add `eslint-plugin-jsx-a11y` rules at error level) | Yes |
| Typecheck | `npm run typecheck` | Yes |
| Unit + component | `npm run test -- --coverage` (threshold on `src/lib/**`) | Yes |
| Migrations in sync | `npx drizzle-kit generate && git diff --exit-code drizzle/` | Yes (after T2.5) |
| Build | `npm run build` | Yes |
| Bundle budget | Script reading `.next/` build output (or `size-limit`) | Yes |
| Integration | Vitest against Postgres/Supabase service | Yes |
| E2E smoke + axe | Playwright, mock mode | Yes |
| E2E golden paths | Playwright vs preview deploy + test DB | Nightly; required before release |
| Lighthouse CI | `lhci autorun` mobile preset | Warn on PR, block on release |
| `npm audit --omit=dev --audit-level=high` | | Warn |

Suggested changes to `.github/workflows/ci.yml`:

1. Add `permissions: contents: read`, `concurrency` (cancel superseded runs on the same ref) and `timeout-minutes` on each job.
2. Split into jobs: `static` (lint, typecheck, unit) → `build` (build + bundle budget, upload `.next` as an artifact) → `integration` (Postgres service) and `e2e-smoke` (downloads the build). Jobs run in parallel where they can.
3. Cache `.next/cache` with `actions/cache`, keyed on the lockfile hash and source hash.
4. Pin Node with an `.nvmrc` (`node-version-file`) so CI and Netlify use the same version.
5. Fix or document the build env: either rename the stub to `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (to compile the real-auth path) or add a second build matrix entry with it set. Note that `pk_test_ci` is not a valid Clerk key format, so a real-mode build may fail at prerender. Use a mock-mode build for smoke tests plus a real-mode build that sets the key from a repository secret on `main` only.
6. Add a nightly `schedule:` workflow for golden-path E2E + Lighthouse against the Netlify deploy preview URL.

Sketch:

```yaml
name: CI
on:
  pull_request:
  push: { branches: [main] }
permissions: { contents: read }
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }

jobs:
  static:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test -- --coverage
        env: { TZ: Asia/Kolkata }

  build:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - uses: actions/cache@v4
        with:
          path: .next/cache
          key: next-${{ hashFiles('package-lock.json') }}-${{ hashFiles('src/**') }}
          restore-keys: next-${{ hashFiles('package-lock.json') }}-
      - run: npm ci
      - run: npm run build          # mock mode: no NEXT_PUBLIC_CLERK key
        env:
          DATABASE_URL: postgresql://ci:ci@localhost/ci?sslmode=disable
      - run: node scripts/check-bundle-budget.mjs
      - uses: actions/upload-artifact@v4
        with: { name: next-build, path: .next, include-hidden-files: true }

  integration:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test }
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 5s --health-retries 10
    env: { DATABASE_URL: postgresql://postgres:test@localhost:5432/postgres }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npx drizzle-kit generate && git diff --exit-code drizzle/
      - run: npm run db:migrate
      - run: npm run test:integration
      # For Supabase instead: supabase/setup-cli + `supabase start` + `supabase db reset`

  e2e-smoke:
    needs: build
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - uses: actions/download-artifact@v4
        with: { name: next-build, path: .next }
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e -- --grep @smoke
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report }
```

The scripts this needs (`test`, `test:integration`, `test:e2e`, `scripts/check-bundle-budget.mjs`) belong in a separate implementation task. This review does not change `package.json`.

## A5. Performance budgets

Target device: a **₹8–12k Android phone** (Moto G / Redmi class, 4 GB RAM, Mali GPU) on **Fast 4G** (Lighthouse mobile preset, 4x CPU throttle).

| Metric | Budget (p75 field / lab) | Notes |
|---|---|---|
| LCP | ≤ **2.5 s** (lab ≤ 2.5 s mobile) | Landing and `/dashboard`. Hero text should be the LCP element, not an image. Use `next/font` with `display: swap` and preload. |
| INP | ≤ **200 ms** | The grid cell → picker open, and the shopping-list check-off. |
| CLS | ≤ **0.1** | Reserve space for the budget ring, avatars and covers. |
| TTFB | ≤ 800 ms | Neon/Supabase in `ap-southeast-1`, and use the pooled connection. |
| First-load JS per route (gzip) | ≤ **150 KB** app routes, ≤ **100 KB** landing and public `/p/[slug]`, `/market` | Clerk's client JS is heavy. Keep public and SEO pages free of `<ClerkProvider>`-dependent client components where possible, and lazy-load the voice button and template picker with `next/dynamic`. |
| Total CSS | ≤ 30 KB gzip | Tailwind purge already helps. |
| Images | Covers ≤ 80 KB WebP/AVIF via `next/image`, with `sizes` set | For TX.3. |
| Lighthouse | Perf ≥ 85 mobile, A11y ≥ 95, Best Practices ≥ 95 | LHCI asserts. |

### `backdrop-filter` cost

- `backdrop-filter: blur()` makes the GPU re-sample everything behind the element on **every frame** that the content behind it changes (scroll, animation). The cost grows with blur radius × element area × the number of overlapping blurred layers. On Mali/Adreno low-tier GPUs this shows up as scroll jank, dropped frames, and battery and thermal drain. Chrome on Android can also fall back to software compositing.
- Today: `--glass-blur: 18px` plus `saturate(160%)` on `.glass`, 22px on `.glass-strong`, and **`backdrop-blur-md` on every assigned grid cell**. A full week is 21 blurred cells inside an already blurred card. That is the worst case.
- Recommendations:
  1. **Grid cells get a solid fill** (`bg-white/90`, no blur). Blur only at the container level.
  2. Rule of thumb: **at most 3 blurred layers visible at once** (sticky nav, one card or hero, one modal). Never put blur on list items or repeated elements.
  3. On small screens, lower the blur radius: `@media (max-width: 640px) { :root { --glass-blur: 10px } }`, and drop `saturate()`.
  4. Add a "lite glass" class toggled from `navigator.deviceMemory <= 4 || navigator.hardwareConcurrency <= 4` (set on `<html>` in a tiny inline script). It swaps to opaque fills. The existing `prefers-reduced-transparency` block is the model for it.
  5. Don't animate elements that sit under or over blurred layers (no parallax backgrounds).
  6. Verify with Chrome DevTools → Rendering → "Frame rendering stats" on a real low-end device (or a BrowserStack Moto G). Target 60 fps while scrolling `/meal-plan`, and no long frames over 50 ms.

## A6. Accessibility checks (WCAG 2.2 AA)

### Contrast on the appetite colours and translucent glass

I measured these with the WCAG formula against the token values in `globals.css`:

| Pair | Ratio | Verdict |
|---|---|---|
| White on `#FF8A1F` (gradient start) | **2.36:1** | Fails for any text |
| White on `#F26419` (`--sw-orange`) | **3.18:1** | Fails normal text, passes large text only (≥ 24 px, or 18.66 px bold) |
| White on `#E63946` (`--sw-red`) | 4.17:1 | Fails normal text |
| `#F26419` text on white | **3.18:1** | Fails as text (links, prices, "text-appetite") |
| `#F26419` on page tint `#FFF3EC` | 2.92:1 | Fails |
| `--sw-muted #6F5F5A` on white | 6.07:1 | Pass |
| `--sw-muted` on `#FFF3EC` | 5.57:1 | Pass |
| `--sw-charcoal` on `#FFF3EC` | 14.9:1 | Pass |
| White on `--sw-green #4F9D3A` | 3.38:1 | Fails normal text |
| `--sw-yellow #F3B02E` on white (non-text, e.g. ring) | 1.9:1 | Fails the 3:1 required for UI components |

Fixes:
- Add a **text-safe** token, `--pc-orange-ink: #C2410C` (5.18:1 on white). Use it for orange text and for the **solid fill behind white button labels**. Keep the bright gradient for decoration, or darken its stops (for example `#D9480F → #C1121F`, which gives 4.3–6.2:1; use bold 16 px+ labels on the lightest stop). Green ink: `#3D7A2C` (5.23:1).
- Translucent glass makes contrast depend on what is behind it. Test against the **worst-case backdrop**: the darkest or most saturated part of the warm radial background, and any image covers. Rule: if text sits on `.glass` over content that can scroll underneath, raise the fill to `--glass-bg-strong` (≥ 0.78 alpha) or add a scrim. Automated axe checks **cannot** compute contrast through `backdrop-filter`, so add a manual checklist item and a Playwright screenshot test with the "lite glass" fallback on.
- Charts and the budget ring: don't rely on colour alone. Add labels or patterns, and keep the ≥ 3:1 non-text ratio for arcs against the track.

### Keyboard navigation on the weekly grid

The current implementation is good but incomplete. Required for TX.4:

1. **Roving tabindex:** only the active cell has `tabIndex=0` and all the others `-1`. Tab enters the grid once and leaves it once. Today it takes 21+ Tab presses to get past the grid.
2. Keys: arrows (done), **Home/End** (first/last day in the row), **Ctrl+Home/End** (first/last cell), Enter/Space opens the picker (done), **Delete/Backspace** removes the meal with a confirm or undo toast, and **Esc** closes the picker and returns focus to the originating cell (verify).
3. The day header buttons inside `role="row"` should use `role="columnheader"` wrapping a `<button>`, not both roles on one element. Keep `aria-rowcount`/`aria-colcount` accurate if rows change (eat-out, snacks).
4. Announce changes: an `aria-live="polite"` region ("Paneer tikka added to Tuesday lunch").
5. Focus ring: 2 px `--sw-orange` on orange-tinted cells is about 2.9:1. Use `--pc-orange-ink` or a 2-colour ring (white + dark) to meet the 3:1 focus-appearance requirement.
6. Drag-and-drop move (if added) must have a keyboard alternative, such as a "Move to…" menu (WCAG 2.5.7 Dragging Movements).
7. On mobile (< 640 px, TX.5): a day view with a list of 3 meal buttons, not a 7×3 grid. Touch targets ≥ 24×24 px (WCAG 2.5.8), aiming for 44 px.

### Other checks in the a11y suite

- axe via `@axe-core/playwright` on every E2E page (serious or critical = fail). Add `eslint-plugin-jsx-a11y` rules at error level.
- Respect `prefers-reduced-motion` (gradient animations, toasts) as well as `prefers-reduced-transparency` (already done).
- Every modal follows the template-picker pattern (focus trap, Esc, focus return). This includes the confirm modal, the T0.3 drawers, and the Razorpay checkout return.
- Forms: visible labels (not just placeholders), errors linked with `aria-describedby`, ₹ inputs with `inputmode="decimal"`.
- `lang="en-IN"` on `<html>`. Dish names in Hindi or other scripts get `lang` attributes when they are known.
- Manual pass each release: NVDA + Chrome, TalkBack on Android, VoiceOver on iOS Safari, 200% zoom, 320 px width reflow.

---

# Part B: Payments and compliance (India)

> All tax rates, thresholds and rules below are my understanding as of late 2026. Indian GST, TDS and RBI rules change often. **Anything marked [verify with a CA/lawyer] must be confirmed before you charge.**

## B1. The business model drives the compliance

There are three ways to sell ₹19–₹199 menus, in increasing complexity:

| Model | Who is the seller | Money flow | Complexity |
|---|---|---|---|
| **M1: Platform-owned menus** | PlateCart sells its own menus (for example the "PlateCart Kitchen" seed menus) | Razorpay **Standard Checkout** → your account | Lowest. A normal online merchant. |
| **M2: Marketplace with split settlement** | The creator sells, PlateCart facilitates and takes a commission | Razorpay **Route**: the payment is split at settlement into the creator's linked account (KYC'd by Razorpay) and your commission | Medium. You are an e-commerce operator (ECO) for GST and income-tax purposes. |
| **M3: Collect everything, pay creators later yourself** | Ambiguous | Standard Checkout → your bank → RazorpayX/UPI payouts to creators | **Avoid.** Holding and settling third-party funds looks like payment aggregation, which RBI regulates. It also muddies who the seller is for GST. **[verify with a CA/lawyer]** |

**Recommendation:** M1 first (if you want revenue early), then M2 via Route. Do not build M3, and do not build an in-app wallet or "credits" that can buy other creators' menus. A semi-closed prepaid instrument needs an RBI licence. Purely closed-loop credits for your own goods are generally exempt, but mixing in creators' goods blurs that line. **[verify with a CA/lawyer]**

## B2. Razorpay: Standard vs Route

- **Standard Checkout** (M1): Order API, then Checkout, then a webhook (`payment.captured`). Settles T+2 or so to your current account. Onboarding needs: KYC of the business (PAN, bank account, address proof; a sole proprietorship is possible with Udyam/GST or a shop licence), and a live website showing **Terms, Privacy, Refund/Cancellation, Contact us, pricing in ₹, and a delivery policy** ("digital; delivered instantly to your account"). Razorpay checks these pages during activation.
- **Route** (M2): needs **separate approval** for a marketplace use case. Each creator becomes a **linked account** with their own KYC (PAN, bank account, name match; a business type such as individual). Transfers can be created at payment time (`transfers` on the order) with an `on_hold` / `on_hold_until` option, which is useful for holding funds through the refund window. Refunds can **reverse transfers** from linked accounts.
- **Fees:** for ₹19 tickets, the gateway fee (about 2% + 18% GST on the fee; UPI pricing varies) plus any Route transfer fee matters. Model the take rate as `price − gateway fee − GST on your commission − TCS/TDS` and set a minimum price (₹19 may barely clear). **Check current Razorpay pricing.**
- **Engineering must-haves (T4.10):** create orders server-side with the amount from the DB. Verify the checkout signature *and* the webhook signature. The webhook is the source of truth. Use an idempotency key (`razorpay_payment_id` unique). Run a daily reconciliation job (Razorpay settlements API vs `menu_purchases`). Store amounts in paise as integers. Keep test and live keys separate, and never ship the key secret to the client.

## B3. KYC

- **Platform:** business PAN, bank account, and (for Route) usually a registered entity. A proprietorship may be accepted. An LLP or Pvt Ltd makes Route, GST and contracts easier. **[verify with a CA/lawyer]**
- **Creators (M2):** PAN (mandatory, and it drives TDS treatment), bank account with name match, and age ≥ 18 (minors cannot contract; block payouts to minors). Razorpay Route performs the linked-account KYC, so do not collect or store PAN or bank documents yourself unless you must. If you do, they are personal data under DPDP, so encrypt them and limit access.
- Collect the creator's legal name, contact and (if GST-registered) GSTIN, for invoices and for the Consumer Protection (E-Commerce) Rules seller-information display.

## B4. Tax

**GST on the platform's commission (M2) or sales (M1)**
- Digital meal plans are a **supply of services**, at **18%** (OIDAR-type or other information services). **[verify with a CA/lawyer: SAC and rate]**
- Registration threshold for services is ₹20 lakh aggregate turnover (₹10 lakh in special-category states). **But** an ECO that is required to collect TCS under Section 52 must register **regardless of turnover** (Section 24(x)). If you run M2, plan to register for GST from day one of paid sales. **[verify with a CA/lawyer]**
- M1 below ₹20 lakh may be exempt from registration. Voluntary registration lets you claim input credit (Razorpay fees carry GST) but adds monthly filings.
- Show prices **inclusive of all taxes** (Consumer Protection E-Commerce Rules). Issue a tax invoice, or a bill of supply if unregistered, per sale.

**TCS under GST (Section 52) for e-commerce operators**
- An ECO collects TCS on the **net taxable value of supplies made through it by other suppliers**. The rate has been 0.5% (0.25% CGST + 0.25% SGST, or 0.5% IGST) since July 2024 (previously 1%). It is deposited monthly (GSTR-8).
- Most creators will be **small, unregistered service suppliers**. Service suppliers through an ECO under the threshold are generally exempt from compulsory registration. TCS mechanics for unregistered suppliers are unclear, and the rules for supplies through ECOs by unregistered persons have been changing. **[verify with a CA/lawyer: whether TCS applies when the creator has no GSTIN, and whether GSTR-8 is still required when it's nil]**
- Also confirm that Section 9(5) (the ECO pays GST *as if* it were the supplier) does **not** apply to digital menus. Today it covers specified services such as passenger transport, accommodation and restaurant services. **[verify]**

**Income tax: TDS under Section 194-O**
- An ECO deducts TDS on the gross amount of sales by e-commerce participants. The rate is **0.1%** (reduced from 1% in Oct 2024), or 5% if the participant has no PAN or Aadhaar. There is an exemption for resident individual or HUF participants below ₹5 lakh gross per year **if they furnish PAN/Aadhaar**. File quarterly returns (26Q) and issue Form 16A. This needs a **TAN**. **[verify with a CA/lawyer]**
- In practice most early creators fall under the ₹5 lakh exemption, but you still must collect PAN and track gross sales per creator per financial year (April–March). Build a `creator_tax_ledger` view on day one of payouts.

## B5. Refunds and consumer protection

- **Consumer Protection (E-Commerce) Rules, 2020** apply to marketplaces and inventory ECOs. Display: legal name, address, customer-care contact, and a **grievance officer** (name, contact). Acknowledge complaints within **48 hours** and resolve within **1 month**. Show seller (creator) details on listings. Show total price including taxes. Show the refund policy before purchase. No fake reviews, and no manipulation of review rankings.
- **CCPA Dark Patterns Guidelines, 2023:** no false urgency ("only 2 left!" on a digital good), no drip pricing, no pre-ticked add-ons, no confirm-shaming, no subscription traps. If a "Month" menu ever becomes recurring, make cancellation as easy as sign-up.
- **Refund policy for digital goods (suggested):** a full refund within **24–48 hours if the menu has not been applied**, or always for duplicate or failed charges, or if the menu was removed for violating policy. After it is applied, no refund except for "not as described" (handled by moderation). Use Route `on_hold` for the window so you are not clawing back from creators. If a refund happens after transfer, reverse the transfer (Route supports this) and net it against the creator's future earnings.
- Chargebacks: keep evidence (purchase timestamp, menu applied timestamp, IP/user id).

## B6. Terms, Privacy and DPDP Act consent

**Documents needed (have a lawyer review the templates):** Terms of Use, **Creator Terms** (licence grant to the platform, commission, payouts, tax deductions, prohibited claims, takedown), Privacy Notice, Refund/Cancellation Policy, Community/Review Guidelines, Grievance Redressal page, Cookie notice (if you add analytics or ads).

**IT Act intermediary obligations (IT Rules 2021):** because you host user content (menus, reviews, profiles), publish your rules, name a **grievance officer**, acknowledge complaints within 24 h and resolve them within 15 days, and act on court or government takedown orders within 36 h. This preserves safe harbour under Section 79. **[verify with a CA/lawyer: exact timelines]**

**DPDP Act 2023 + DPDP Rules 2025** (notified Nov 2025, phased in. Most Data Fiduciary obligations become enforceable **around May 2027**. Build for them now, because retrofitting consent is painful. **[verify exact commencement dates]**):
- **Notice + consent** at sign-up: a standalone, plain-language notice listing the data items and purposes (meal planning, budget tracking, marketplace, payments), how to withdraw consent, how to complain to the Data Protection Board, and grievance contact. Consent must be free, specific, informed, unambiguous, and **as easy to withdraw as to give**. Keep a **consent log** (who, notice version, timestamp, purposes).
- **Sensitive-in-practice data:** diet type, allergies, health goals (weight loss, diabetes-friendly), household size, and spend. DPDP has no special category, but the IT Act SPDI Rules 2011 (health and financial data) apply until DPDP fully replaces them. Treat health-adjacent fields as **optional**, ask for explicit consent, and exclude them from analytics and AI prompts unless the user opts in.
- **Children:** under-18s need **verifiable parental consent** and must not be tracked or targeted. Simplest v1: an age gate (18+) in Terms and onboarding, and block creator payouts to under-18s.
- **Rights:** access, correction, erasure (T2.11 delete account must actually delete, or anonymise reviews), grievance, nominee. **Breach notice** to affected users and the Board without delay (the Rules specify a 72-hour detailed report to the Board).
- **Retention:** delete inactive accounts' data after the purpose ends (the Rules give a 3-year inactivity standard for certain large platforms; adopt a stated retention period anyway). Payment and tax records are kept for the statutory period (generally 8 years for GST books; **[verify]**). That is lawful retention even after deletion, so separate them from profile data.
- **Processors:** Clerk (US), Neon/Supabase (Singapore), Razorpay (India), Netlify, Sentry. Sign their DPAs and list them in the Privacy Notice. Cross-border transfer is allowed except to countries the government restricts. **[verify]**
- **Data localisation:** card and payment data is stored by Razorpay (RBI localisation applies to them). Do not store card data yourself.

## B7. Food and health-claim disclaimers

Meal plans read as health advice. Risk sources: Consumer Protection Act (misleading ads; CCPA Misleading Advertisement Guidelines 2022), the Drugs and Magic Remedies (Objectionable Advertisements) Act 1954 (claims to cure or treat listed conditions, including diabetes and obesity), ASCI code, and negligence claims (allergens).

- **Site-wide disclaimer** (footer + menu pages + first purchase): "Menus are general meal ideas, not medical or nutritional advice. Consult a doctor or registered dietitian before changing your diet, especially if you are pregnant, have diabetes, kidney or heart conditions, or allergies. Nutrition and calorie values are estimates. Check ingredient labels for allergens."
- **Allergen display:** show the 14-style common allergens (milk, nuts, peanuts, gluten, soy, egg, fish, shellfish, sesame) when ingredients are known. Label allergen data as "creator-supplied".
- **Creator rules (in Creator Terms + listing form):** no claims to cure, treat or prevent disease. No guaranteed weight loss ("lose 10 kg in 30 days"). No "doctor-approved" or "clinically proven" without evidence. Credentials (for example "Registered Dietitian") are shown only after verification.
- **Automated pre-publish checks:** a keyword list (cure, reverse diabetes, guaranteed, detox cures, medicine, lose X kg) flags listings for manual review.
- "Veg" / "pure veg" / "Jain" / "egg" labels are creator claims. Show them as such. They matter to users on religious grounds, so mislabelling is a top report reason.
- FSSAI licensing is not needed to sell meal *plans* (no food is supplied). It will be needed if you ever sell or deliver food. **[verify if Phase 6 delivers food]**

## B8. Content moderation for reviews and listings

- **Eligibility:** only buyers or users who copied the menu can rate (already in the roadmap). One rating per user per menu (editable). Creators cannot rate their own menus (check the user id and payout bank or PAN match to catch alt accounts).
- **Anti-gaming:** a minimum account age (for example 48 h) before rating. Rate-limit reviews. Detect bursts (many 5★ from new accounts). Show the rating distribution and count, not just the average. Use a Bayesian average for sorting (so 1 × 5★ does not outrank 200 × 4.6★). Do not suppress negative reviews or let creators pay to remove them (CCPA fake-review rules; BIS IS 19000:2022 on online consumer reviews is a good reference standard).
- **Pipeline:** a profanity and PII filter on submit (phone numbers, UPI IDs, emails, so people can't take deals off-platform), a report button on reviews and listings with reasons (spam, offensive, misleading health claim, wrong veg label, copyright), an admin queue (T4.7) with hide/restore, and an audit log of moderator actions. Notify the author with a reason (appeal via the grievance officer).
- **Creator replies:** one public reply per review.
- **Copyright:** menus copied from other creators or books. Run a notice-and-takedown process and a duplicate-menu detector (same template ids in the same order).

## B9. Free-first, paid-later path

| Stage | What ships | Compliance needed before launch |
|---|---|---|
| **S0: Free marketplace** (Phase 4 minus T4.9–T4.11) | Free menus, "Get menu", ratings, reports, moderation | Terms of Use, Creator Terms (licence, content rules), Privacy Notice + DPDP-style consent and consent log, 18+ age gate, health/allergen disclaimers, review guidelines, grievance officer page, report + admin queue, account deletion that works. **No GST/TCS/TDS yet** (no money). |
| **S1: Tips or "support the creator" (optional)** | **Skip.** Tips that flow to creators raise the same payout questions as sales. If you want early revenue, use S1b. | n/a |
| **S1b: Platform-owned paid menus (M1)** | Razorpay Standard Checkout for PlateCart Kitchen menus only | Business entity + PAN + current account, Razorpay activation (policy pages live), refund policy, invoices/bills of supply, GST registration decision (likely not needed below ₹20 lakh unless ECO rules apply; **[verify]**), price shown tax-inclusive, webhook idempotency + reconciliation. |
| **S2: Creator paid menus (M2)** | Route linked accounts, commission (for example 15–20%), creator dashboard earnings, payouts with hold period | All of S1b, plus: Route approval, **GST registration as ECO**, TCS process (GSTR-8) **[verify applicability]**, **TAN + 194-O TDS** process and per-creator FY ledger, creator KYC via Route, Creator Terms covering commission, tax deductions, refunds and clawbacks, seller info on listings, a CA retained for monthly filings. |
| **S3: Scale** | Subscriptions, bundles, promotions | e-Mandate rules for recurring payments (AFA above thresholds), dark-pattern review, DPDP full compliance audit before May 2027. |

**Trigger to move S0 → S2:** for example, ≥ 200 menus "got" per week and ≥ 30 creators with ≥ 4.0★ and ≥ 10 ratings. This proves demand before taking on GST, TCS and TDS overhead.

## B10. Checklist: before charging the first rupee

Legal / business (🙋 Raphy)
- [ ] Business entity chosen (proprietorship vs LLP/Pvt Ltd) with a CA. Business PAN and current account.
- [ ] GST decision documented by a CA (M1 threshold vs M2 compulsory ECO registration). GSTIN obtained if required. TAN obtained if running M2.
- [ ] Lawyer-reviewed Terms of Use, Creator Terms, Privacy Notice, Refund/Cancellation, Community Guidelines, and a Disclaimer page, all linked in the footer and checkout.
- [ ] Grievance officer named (name, email, response SLAs) on a Contact/Grievance page. Customer-care email and phone.
- [ ] Razorpay account activated (Standard). For creators: Route approved.

Product / engineering (🤖)
- [ ] Prices shown inclusive of taxes, with the seller (creator) name on the listing and the refund policy shown before "Pay".
- [ ] Server-side order creation, signature + webhook verification, idempotent purchase grant, and a reconciliation job with alerts on mismatch.
- [ ] Integer paise everywhere. Commission and tax split math unit-tested to reconcile to the paisa.
- [ ] Refund flow (admin) that revokes or keeps access per policy and reverses Route transfers.
- [ ] Invoice or receipt email per purchase (GSTIN if registered, SAC, tax breakup).
- [ ] Consent log, age gate, account deletion that preserves only legally required payment/tax records.
- [ ] Health-claim keyword flagging and the moderation queue are live. Disclaimer on menu and checkout pages.
- [ ] E2E-24 and E2E-25 pass in Razorpay test mode. Live mode smoke-tested with a ₹1 internal purchase and refund.
- [ ] Sentry (TX.2) and Upstash rate limiting (TX.1) live on payment and review endpoints.

## B11. Open questions to take to a CA/lawyer

1. Exact SAC code and GST rate for selling digital meal plans; whether these are OIDAR services.
2. Is GST registration compulsory for M2 if every creator is unregistered and no TCS is collectable? Is a nil GSTR-8 still required?
3. 194-O applicability and thresholds for creators who are individuals, and whether the platform should be the seller (M1-style for all) to simplify.
4. Whether Razorpay Route accepts a proprietorship as the platform account.
5. Whether a closed-loop "credits" feature would ever be a PPI under RBI rules.
6. DPDP commencement dates and whether diet or health fields need extra safeguards beyond consent.
7. Liability wording for allergen and health disclaimers. Whether a creator "dietitian" badge needs verification of registration.
8. The record-retention period for GST and income-tax documents that overrides user erasure requests.
