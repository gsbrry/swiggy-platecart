# 03 — Application Security Review

**Reviewer:** AppSec panel member · **Date:** 2026-10-29 · **Commit:** `af21805` · **Scope:** `src/middleware.ts`, `src/lib/*`, `src/app/api/**`, `src/db/schema.ts`, `next.config.mjs`, `.env.example`, `.github/workflows/ci.yml`, `package.json` (plus `npm audit --omit=dev`). The review also covers the planned work: Supabase Auth with Postgres RLS, public share pages, the UGC marketplace (menus, reviews, ratings), Razorpay, image uploads and geolocation.

## TL;DR

The route handlers are mostly well written. Every one derives `userId` from the server session, uses zod, and scopes queries by owner. The biggest risk is outside the handlers: **mock mode fails open.** If the publishable-key env var is missing or misnamed in production, authentication turns off for the whole app. `.env.example` and CI both use the wrong variable name today. The next two problems are paywall and ranking logic that trusts the client, and a dependency tree with 1 critical and 10 high advisories. The planned Supabase move is a chance to replace the "RLS" code comments with real database-enforced RLS.

---

## Findings

Severity scale: **Critical** means exploitable now or one misconfiguration from full compromise. **High** means data exposure or business-logic abuse with no special preconditions. **Medium** means defense-in-depth gaps or abuse at scale. **Low** means hygiene.

| # | Severity | File:line | Issue | Fix |
|---|---|---|---|---|
| S1 | **Critical** | `src/lib/mock.ts:9-11`, `src/middleware.ts:58-60`, `src/lib/current-user.ts:14` | **Mock mode fails open.** `isMockMode()` is true whenever `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is unset. In that state the middleware skips Clerk, and `getCurrentUser()` returns the shared `mockUser` for **every anonymous request**. If `DATABASE_URL` is set, all DB-writing routes still run as that one shared identity: `POST /api/templates`, `/fork`, `/meal-plans`, `/waste/log` and `PATCH /user/profile`. A missing, misspelled or build-time-only env var in Netlify silently ships a public, unauthenticated app that looks healthy. | Make mock mode opt-in and refuse it in production. Use `isMockMode = () => process.env.PLATECART_MOCK === "1" && process.env.NODE_ENV !== "production"`. Throw at boot (in `instrumentation.ts` or the middleware module scope) if `NODE_ENV==="production"` and auth keys are missing. Also show a visible "DEMO MODE" banner whenever mock mode is on. |
| S2 | **Critical** (enabler of S1) | `.env.example:2`, `.github/workflows/ci.yml:24` | The template uses `CLERK_PUBLISHABLE_KEY`, but the code reads **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`**. Anyone who copies `.env.example` into Netlify gets mock mode (S1). CI builds in mock mode too, so it never tests the real auth path. | Rename the variable in `.env.example` and CI. Add a CI job that builds with mock **off** and asserts that `/api/user/profile` returns 401 without a session. |
| S3 | **High** | `package.json` (`next@14.2.35`, `@clerk/nextjs@5.7.6`, `drizzle-orm@0.36.4`, `zod@3.25.76`) | `npm audit --omit=dev` reports **1 critical and 10 high**. Next.js has several DoS and request-smuggling advisories whose fixes are only in 15.5.x or later, and the 14.x line no longer gets fixes. Clerk has an authorization bypass (GHSA-w24r-5266-9c3c), drizzle-orm has SQL injection through escaped identifiers (GHSA-gpj5-g38j-94v9, fixed in 0.45.2), and zod has a memory-exhaustion advisory. Transitive advisories include postcss, js-cookie and nanoid. The installed version is past the patch for the middleware-bypass CVE-2025-29927 (14.2.25), which is good. | Upgrade to Next 15.5.x LTS or later and drizzle-orm ≥0.45.2. Drop `@clerk/*` and `svix` once Supabase lands. Run `npm audit --omit=dev --audit-level=high` as a blocking CI step and enable Dependabot. Current exploitability is moderate: there are no dynamic identifiers and no `next/image` remotePatterns. Still, upgrade before any public launch. |
| S4 | **High** (once paid menus exist; Medium today) | `src/app/api/templates/route.ts:68-97` | `is_paid` and `price` are **client-controlled with no upper bound and no seller verification**. Any user can list a paid menu at any price without KYC. | Remove `is_paid` and `price` from the public create schema. Set them only through a seller flow gated on `users.seller_verified` (KYC/PAN done), with a `price` cap (for example ≤ ₹999) stored as integer paise. |
| S5 | **High** (once paid; Medium today) | `src/app/api/templates/[id]/route.ts:18-25`, `src/app/api/templates/[id]/fork/route.ts:18-50`, `src/app/api/cart/build/route.ts:52-58` | **Paywall bypass.** Every public template returns `ingredients` to any signed-in user, and `fork` copies a paid template's ingredients into a free private copy. `cart/build` also aggregates ingredients of paid templates the caller never bought. | Access rule: `is_public AND (NOT is_paid OR purchased(user) OR creator = user)`. Show only a preview (name, tags, rating, ingredient count) otherwise. Block forking of paid templates unless purchased. Enforce this in RLS (see the checklist), not only in route code. |
| S6 | **High** | `src/app/api/meal-plans/[id]/slots/route.ts:10-15, 49-65` | **IDOR on `template_id`.** Ownership of the meal plan is checked, but the caller can assign **any** template UUID, including another user's private one. `GET /api/meal-plans/current` (`with: { template: true }`) and `/meal-plan` then return that private template's row. The FK error compared with success also acts as an existence oracle. | Before writing, check `templates.id = template_id AND (is_public OR creator_id = user.id)` and return 404 otherwise. Under Supabase, a `WITH CHECK` policy on `meal_plan_slots` should require a visible template (a `template_visible(template_id)` helper). |
| S7 | **Medium** | `src/lib/rate-limit.ts:7-29` and the routes that skip it | The rate limiter is in-memory and per instance, so it resets on cold start and serverless scale-out makes it meaningless. The `Map` is never evicted, which leaks memory. **No limit at all** on `POST /api/templates`, `/fork`, `/meal-plans`, `/meal-plans/[id]/slots`, `/waste/log`, `PATCH /user/profile` or the webhook. There is no IP-based limit for unauthenticated routes, which share pages and the marketplace will need. | Move to Upstash Redis (`@upstash/ratelimit`, sliding window), keyed by `user:{id}` **and** `ip:{x-forwarded-for first hop}`. Use the per-route budgets in the checklist. Fail closed on write routes if Redis is down. |
| S8 | **Medium** | `src/app/api/templates/[id]/fork/route.ts:53-56` | **Ranking manipulation.** `fork_count` increments on every call with no per-user dedup, so one account can push any template to the top of "popular". The same pattern would break future ratings and upvotes. | Use a `template_forks(user_id, template_id)` unique table and derive counts from it, or increment only on first insert (`ON CONFLICT DO NOTHING ... RETURNING`). Rank on distinct, age-weighted users. |
| S9 | **Medium** | `src/middleware.ts:18-19` | The CSP allows `script-src 'unsafe-inline'`, which cancels most XSS protection. That matters once user-generated menus and reviews render. | Use a per-request nonce CSP: generate a nonce in middleware, set `script-src 'self' 'nonce-…' 'strict-dynamic'`, and pass it through the `x-nonce` header to `<Script nonce>`. Keep `'unsafe-inline'` for styles only. Ship as `Content-Security-Policy-Report-Only` with a `report-to` endpoint for one week, then enforce. |
| S10 | **Medium** | `src/middleware.ts:22, 35, 33` | `connect-src` lists `*.neon.tech`, which the browser never contacts (it is server-only), so remove it. `Permissions-Policy` sets only the microphone and leaves camera, geolocation and payment at browser defaults. HSTS has no `preload`. There is no `Cross-Origin-Opener-Policy`. | `Permissions-Policy: microphone=(self), geolocation=(), camera=(), payment=(), usb=()`. Flip geolocation to `(self)` only when T5.2 ships. Add `preload` and `COOP: same-origin` (use `same-origin-allow-popups` if Razorpay Checkout's popup needs it). |
| S11 | **Medium** | `src/app/api/templates/route.ts:61-75`; `src/lib/validation/common.ts:10-16` | Validation is uneven. `tags`, `unit` and `instamart_search_hint` accept any characters, and `is_public` defaults to whatever the client sends, so content goes into the public feed with **no moderation**. React escaping prevents XSS today, but this content will flow into OG images, emails, share-page `<meta>` tags and the Swiggy MCP. | Use `safeText()` or enums for tags and units. Hold new public content in `status='pending'` until it passes automated checks (blocklist, link and phone-number detection) or a review, and add a `reports` table. Never render UGC with `dangerouslySetInnerHTML`. Escape it in `generateMetadata`. |
| S12 | **Medium** | `src/lib/current-user.ts:25-35`, `src/app/api/auth/webhook/route.ts:54-58` | `name` falls back to the **email address**. Once a creator name appears on public menus or share pages, users' emails leak. The lazy insert also races: two first requests trigger a unique violation and a 500. | Never derive a display name from email. Use first name, or "PlateCart cook #1234". Use `onConflictDoNothing()` and then re-select. |
| S13 | **Medium** | `src/app/api/auth/webhook/route.ts:52-67` | There is no `user.deleted` handler, so deleting a user in the identity provider leaves their personal data in Postgres. That is a DPDP erasure gap. | Handle deletion: hard-delete or anonymize the user and their logs, and transfer or anonymize public templates. Under Supabase, use an `auth.users` `ON DELETE CASCADE` FK or trigger. |
| S14 | **Low** | All mutating routes | There is no explicit CSRF or Origin check. A SameSite=Lax session cookie mitigates cross-site POSTs today. `req.json()` also parses `text/plain` bodies, so the protection depends on cookie defaults. | Reject mutating requests whose `Origin` header is not the app origin, and require `Content-Type: application/json`. |
| S15 | **Low** | All `req.json()` routes | There is no body-size cap, and combined with the zod memory advisory a large payload can cost memory or CPU. | Check `content-length` ≤ 64 KB (≤ 1 MB for template create) before parsing. |
| S16 | **Low** | `src/app/api/templates/route.ts:44` | `ilike '%q%'` does not escape `%` and `_`, and a leading wildcard forces a full scan, which is a cheap DoS on a large table. | Escape the wildcards and use `pg_trgm` or a full-text search index. |
| S17 | **Low** | `src/app/api/cart/add-to-instamart/route.ts:9-14, 29-36` | `quantity` has no upper bound, and the free-text `instamart_search_hint` goes straight to the Swiggy MCP, which risks parameter or prompt injection into an LLM-adjacent tool. The mock short-circuit runs before validation. | Cap quantity (for example ≤ 50 units or 10 kg) and apply `safeText` to the hint. Build the cart server-side from template IDs rather than trusting client items. Validate before the mock branch. |
| S18 | **Low** | `.env.example:16-17`, `src/lib/swiggy-mcp.ts:10-17` | The legacy tenant-wide `SWIGGY_MCP_API_KEY` is still read. A single shared privileged key is risky. | Delete the key when per-user OAuth (2.1) ships. Keep `SWIGGY_TOKEN_ENC_KEY` in the host's secret store, plan to rotate it, and never prefix it with `NEXT_PUBLIC_`. |
| S19 | **Info** | `src/app/api/*` (all 400 responses) | Zod `issues` are echoed to the client. This is harmless now but reveals the schema. | Return `issues` only when `NODE_ENV !== "production"`. |

**What is already good:** `userId` always comes from the session and never from the body. UUIDs are validated with zod. Owner scoping is present in every list and read query. The svix webhook is verified with timestamp tolerance against the raw body. `X-Frame-Options`, `frame-ancestors 'none'` and `nosniff` are set. The voice transcript is sanitized with an allowlist. No live secrets were found in git history: only `pk_test_xxx` placeholders, and `.env*` is gitignored.

---

## Security requirements for v1 (builder checklist)

Each item is a gate, and none can be skipped for launch. Tick each one in the PR that implements it.

### 1. Mock mode and environment
- [ ] Mock mode only when `PLATECART_MOCK=1` **and** `NODE_ENV !== "production"`. The prod build/boot fails if Supabase env vars are missing (S1, S2).
- [ ] `.env.example` lists the exact names the code reads. Add a `src/env.ts` zod schema that validates `process.env` at boot and splits server from client variables.
- [ ] CI includes one "real-auth" smoke job that confirms unauthenticated `/api/*` requests return 401.

### 2. Secrets
- [ ] Browser-safe values only: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key). Everything else is server-only.
- [ ] `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SWIGGY_MCP_CLIENT_SECRET`, `SWIGGY_TOKEN_ENC_KEY` and upload-provider secrets live only in Netlify env (scoped to Production vs Deploy Previews) and are **never** `NEXT_PUBLIC_*`.
- [ ] The service-role client lives in one file, `src/lib/supabase/admin.ts`, that starts with `import "server-only"`. Only webhooks and admin jobs may import it, and an ESLint `no-restricted-imports` rule enforces that.
- [ ] Deploy Previews use a **separate** Supabase project or branch and Razorpay **test** keys, never prod secrets.
- [ ] Enable GitHub secret scanning and push protection. Rotate any key that has been pasted into chat, logs or tickets.
- [ ] Logs never contain tokens, emails, phone numbers, precise locations or payment payloads.

### 3. Supabase Auth and RLS
- [ ] **RLS is enabled on every table in `public`**, with no exceptions, and a CI SQL check fails if any table has `relrowsecurity = false`. Run Supabase `get_advisors` (security) before each release.
- [ ] Use `auth.uid()` as the identity. `users.id` references `auth.users(id) ON DELETE CASCADE` (this replaces `clerk_id`).
- [ ] Route handlers use the **user-scoped** server client (`@supabase/ssr` with cookies), never the service role, so RLS is the real enforcement layer. Keep the existing `WHERE user_id = …` filters as a second layer.
- [ ] Wrap `auth.uid()` as `(select auth.uid())` in policies so it is evaluated once per statement. Index every column used in a policy (`user_id`, `creator_id`, `template_id`).
- [ ] Baseline policies:

```sql
-- users: self only. No INSERT from the client; a trigger on auth.users creates the row.
create policy users_self_rw on users for all
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Private per-user data: meal_plans, orders_log, waste_log, purchases (read-only to the client)
create policy own_rows on meal_plans for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- meal_plan_slots: via the parent plan, and the assigned template must be visible (fixes S6)
create policy own_slots on meal_plan_slots for all
  using (exists (select 1 from meal_plans p where p.id = meal_plan_id and p.user_id = (select auth.uid())))
  with check (
    exists (select 1 from meal_plans p where p.id = meal_plan_id and p.user_id = (select auth.uid()))
    and (template_id is null or public.template_visible(template_id))
  );

-- templates: read public+approved or own; write own only; is_paid/price/status/counters not client-writable
create policy tpl_read on templates for select
  using ((is_public and status = 'approved') or creator_id = (select auth.uid()));
create policy tpl_write on templates for insert
  with check (creator_id = (select auth.uid()) and is_paid = false and status = 'pending');
create policy tpl_update on templates for update
  using (creator_id = (select auth.uid())) with check (creator_id = (select auth.uid()));
revoke update (fork_count, buy_count, rating_avg, rating_count, status, is_paid, price)
  on templates from authenticated;   -- only security definer functions / service role touch these

-- template_ingredients: readable only if the template is free+public, owned, or purchased (fixes S5)
create policy ing_read on template_ingredients for select
  using (public.template_content_unlocked(template_id));

-- reviews: one per (user, template); author must have purchased/forked/cooked; no self-review
create policy review_insert on reviews for insert
  with check (user_id = (select auth.uid()) and public.can_review(template_id));
```

- [ ] Helper functions (`template_visible`, `template_content_unlocked`, `can_review`) are `security definer`, `set search_path = ''`, `stable`, and owned by a non-superuser role. Grant `execute` only to `authenticated`.
- [ ] **Never** use `user_metadata` / `raw_user_meta_data` in policies, because users can edit it. Roles such as admin, moderator and seller come from a server-managed `app_metadata` or a `user_roles` table.
- [ ] **Public share pages** read through a dedicated view or RPC (for example `public_menu(slug)`) that returns an allowlisted column set: no `creator_id` UUID, email or budget. Use unguessable slugs (≥ 10 random chars, not UUID v1 or a sequential ID). Add `noindex` unless the owner opts in. Shares can be revoked by rotating the slug.
- [ ] Auth settings: email confirmation on, leaked-password protection on, minimum length ≥ 10, OTP expiry ≤ 10 minutes, CAPTCHA (hCaptcha or Turnstile) on sign-up, sign-in and OTP. Phone OTP is rate limited per number and per IP, and SMS spend is capped. Redirect URLs are an exact allowlist with no wildcards.
- [ ] Storage buckets are private by default (see uploads below), and every bucket has its own RLS policies on `storage.objects`.

### 4. CSP and headers (update `src/middleware.ts`)
- [ ] Nonce-based `script-src 'self' 'nonce-{n}' 'strict-dynamic'`, with no `'unsafe-inline'` for scripts (S9).
- [ ] `connect-src 'self' https://<project>.supabase.co wss://<project>.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com`, with Clerk and Neon removed.
- [ ] `frame-src https://api.razorpay.com https://checkout.razorpay.com`, plus `script-src https://checkout.razorpay.com` (allowed by `strict-dynamic` and the nonce).
- [ ] `img-src 'self' data: blob: https://<project>.supabase.co` (Storage) or the single image CDN host, with no wildcards.
- [ ] `Permissions-Policy: microphone=(self), geolocation=(self), camera=(), payment=(self "https://api.razorpay.com")`. Set geolocation to `(self)` only once T5.2 ships.
- [ ] Add `upgrade-insecure-requests`, `report-to`/`report-uri`, HSTS `preload` and `Cross-Origin-Opener-Policy: same-origin-allow-popups`.
- [ ] Roll out as Report-Only for at least 7 days, then enforce. Add a Playwright test that asserts the header is present on `/`, a share page and `/api/*`.

### 5. Rate limits (Upstash, user **and** IP keys, 429 with `Retry-After`)
| Surface | Limit |
|---|---|
| Sign-in / OTP / sign-up | 5/min per IP, 10/hour per phone or email, CAPTCHA after 3 failures |
| Public share pages, marketplace browse/search (anon) | 60/min per IP |
| Template create / update | 10/hour per user, 30/day |
| Review / rating create | 5/hour per user, 1 per template (DB unique) |
| Report-abuse | 10/hour per user |
| Fork | 30/hour per user, counted once per (user, template) |
| Cart build / add-to-Instamart | 10/min per user (existing) |
| Voice parse | 20/min per user (existing) |
| Upload signed-URL issue | 20/hour per user, 50 MB/day |
| Razorpay order create | 5/min per user |
| Webhooks | no user limit; verify signature first, 1 MB body cap |

### 6. Marketplace, UGC, reviews and ratings
- [ ] All UGC is rendered as text through React, with no `dangerouslySetInnerHTML`, no markdown-to-HTML without `rehype-sanitize`, and no user-supplied URLs in `href` without an `https:` allowlist plus `rel="nofollow ugc noopener"`.
- [ ] UGC length caps and a character allowlist are enforced in zod **and** in DB `CHECK` constraints.
- [ ] New public menus and reviews start in `status='pending'`. An automated profanity, link and phone-number filter runs before auto-approve. Add a `reports` table and a moderator queue, plus a shadow-ban flag.
- [ ] Ratings: one per user per template (unique index). Only users who forked, bought or cooked the template can rate. No self-rating. Accounts must be at least 24 hours old with a verified email or phone. Aggregates are computed server-side (trigger or cron) and the client never writes them. Rank with a Bayesian average, not the raw mean.
- [ ] Watch for collusion: flag bursts of ratings from new accounts or from the same IP or device on one creator.

### 7. Razorpay payments (when T4.10 ships)
- [ ] Create orders **server-side** with the amount read from the DB (paise integer), never from the client.
- [ ] On the client callback, verify `HMAC_SHA256(order_id + "|" + payment_id, KEY_SECRET)` with `crypto.timingSafeEqual`. Treat the callback as UX only. **Grant access only from the webhook.**
- [ ] The webhook verifies `X-Razorpay-Signature` against the **raw body** (`await req.text()`) using `RAZORPAY_WEBHOOK_SECRET`, with a constant-time compare. Reject requests without the header.
- [ ] Idempotency: a `payment_events(event_id unique)` table plus `purchases(razorpay_payment_id unique)`. Insert with `ON CONFLICT DO NOTHING` inside one transaction, and return 200 on replays. Process `payment.captured`, `order.paid` and `refund.processed`. Re-fetch the payment from the Razorpay API before granting access.
- [ ] The service role is used only inside the webhook. Purchases are `select`-only to their owner through RLS.
- [ ] Do not store card, VPA or bank details. Keep only Razorpay IDs, amount, status and timestamps (PCI scope stays with Razorpay).

### 8. Image uploads (TX.3)
- [ ] Upload directly to Supabase Storage (or a provider) with **short-lived signed upload URLs** issued after an auth and rate-limit check. Path is `{auth.uid()}/{uuid}.{ext}`, and the storage RLS policy enforces `(storage.foldername(name))[1] = auth.uid()::text`.
- [ ] Allowlist `image/jpeg`, `image/png` and `image/webp` with a **≤ 5 MB** cap. Verify magic bytes server-side. **Reject SVG.** Re-encode through an image transform, which also strips EXIF/GPS metadata.
- [ ] Serve from a separate origin/CDN with `Content-Disposition: inline`, the correct `Content-Type` and `nosniff`. Never serve uploads from the app origin.
- [ ] If `next/image` is used, set exact `remotePatterns` (no wildcards). That configuration is exposed to the Next image-optimizer DoS advisory, so upgrade Next first (S3).

### 9. Geolocation and privacy (DPDP Act 2023 / DPDP Rules 2025 basics)
- [ ] **Notice and consent:** show a plain-language notice in English (and Hindi if feasible) at sign-up listing the data collected (name, phone/email, diet, household size, budget, orders, waste, location), the purpose and retention period, and how to withdraw consent. Consent is a separate, unticked opt-in per optional purpose (location, marketing, public profile). Store a `consents(user_id, purpose, version, granted_at, withdrawn_at)` log.
- [ ] **Data minimisation for location:** request browser geolocation only on the "Suggest a place" action, never on page load. Round to about 1 km (3 decimal places) or store the city or geohash-5, and **never store raw lat/long tied to a user**. Never show another user's location. Exclude location from public share pages.
- [ ] Treat diet type (Jain or other religious-linked diets), budget and household size as **sensitive in practice**. They are private by default, never on share pages, and never sent to analytics.
- [ ] **Rights:** in-app "Download my data" (JSON export) and "Delete my account". Deletion cascades or anonymises within 30 days and covers backups on rotation. A correction path is the settings page. Publish a grievance contact (name and email) and respond within 90 days.
- [ ] **Children:** require age ≥ 18 at sign-up (checkbox plus terms), because DPDP needs verifiable parental consent for under-18s. Run no tracking or targeted ads.
- [ ] **Breach response:** keep a written runbook to notify the Data Protection Board and affected users without delay (initial notice, detailed report within 72 hours). Keep access logs for at least 1 year.
- [ ] **Processors:** list Supabase, Netlify, Razorpay, Upstash, Swiggy and the image CDN in the privacy policy. Choose the Supabase region `ap-south-1` (Mumbai) for data locality and latency.
- [ ] **Retention:** delete waste and order logs after 24 months of inactivity, and delete raw location after 30 days or never store it.

### 10. Dependencies and CI
- [ ] Upgrade to Next ≥ 15.5.x patched and drizzle-orm ≥ 0.45.2. Remove `@clerk/*` and `svix` after the migration (S3).
- [ ] CI runs `npm audit --omit=dev --audit-level=high` (blocking), Dependabot or Renovate weekly, and CodeQL or Semgrep (`p/nextjs`, `p/secrets`).
- [ ] Add authorization tests for every route: for each `[id]` route, user B gets 404 for user A's resource. Add RLS tests with `pgTAP` or Supabase test helpers that assert cross-user `select` returns 0 rows.

### 11. Small fixes to apply now (pre-migration)
- [ ] S1/S2 mock-mode fail-closed and env rename.
- [ ] S6 template visibility check on slot PATCH.
- [ ] S4/S5 server-forced `is_paid=false, price=0` until payments ship, which removes the paywall surface entirely.
- [ ] S8 dedup fork counts. S12 no email as display name.
