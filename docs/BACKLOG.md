# Backlog

Plan and rationale: [`ROADMAP.md`](ROADMAP.md). Tick a box when the task is merged.

**Owner legend**
- 🤖 Claude can do it end to end (code, tests, build, commit, push) with no input.
- 🌐 Claude can do it with browser access to a dashboard (Clerk / Neon / Netlify / Razorpay).
- 🙋 Raphy only (accounts, money, legal, keys, product calls).

Ground rules for every task: TypeScript strict, Zod at API boundaries, every query filtered by the internal `users.id`, mock mode still boots, `npm run typecheck && npm run lint && npm run build` pass.

---

## Phase 0: Theme
- [x] **T0.1** 🤖 Appetite palette (orange + red tint) as CSS tokens in `globals.css`
- [x] **T0.2** 🤖 Glassmorphism utilities (`.glass`, `.glass-strong`, `.bg-appetite`) applied to all cards, bars, and primary buttons
- [ ] **T0.3** 🤖 Glass pass on modals, dropdowns, and the template picker drawer (stronger blur, darker scrim)
- [ ] **T0.4** 🤖 Dark mode tokens (warm charcoal glass)

## Phase 1: Standalone planner (no Swiggy)
- [ ] **T1.1** 🤖 Remove `/cart`, `components/cart/*`, `api/cart/*`, and `lib/swiggy-mcp.ts`. Move `SWIGGY_MCP_INTEGRATION.md` to `docs/later/`. Drop the `SWIGGY_*` env vars from `.env.example`.
- [ ] **T1.2** 🤖 Shopping list: `/shopping-list` page that merges `template_ingredients` for the selected day or week, with check-off and "Copy / Share" (Web Share API, WhatsApp text fallback)
- [ ] **T1.3** 🤖 Replace every "Add to Instamart" CTA (dashboard meal cards, meal-plan sidebar, template detail) with "Add to shopping list"
- [ ] **T1.4** 🤖 Budget: add `expenses` table (`user_id, amount, category groceries|eatout|other, note, spent_at`), an "Add expense" form, and switch the budget summary to it. Remove `orders_log.source = instamart`.
- [ ] **T1.5** 🤖 Voice button: rename to "Voice add to plan" and route the parsed dish into a plan slot instead of a cart
- [ ] **T1.6** 🤖 Rewrite the landing page, `layout.tsx` metadata, onboarding, and settings copy to remove Swiggy and Instamart. Remove the "connected accounts" Swiggy row.
- [ ] **T1.7** 🤖 Rename the internal `--sw-*` tokens to `--pc-*` (brand-neutral) so a rebrand is a single file change

## Phase 2: Real login and database
- [ ] **T2.1** 🙋 Decide on the stack (recommended: Clerk + Neon) and sign-in methods (recommended: email + Google)
- [ ] **T2.2** 🌐/🙋 Create the Clerk app, enable Google, and copy the publishable, secret, and webhook keys
- [ ] **T2.3** 🌐/🙋 Create the Neon project (region `ap-southeast-1`, nearest to India) and copy the pooled `DATABASE_URL`
- [ ] **T2.4** 🙋 Put the keys in Netlify env vars and in this cloud environment's secrets. Don't paste secret keys into chat.
- [ ] **T2.5** 🤖 `db:generate` + `db:migrate`, commit `drizzle/` migrations, and add a CI check that the schema and migrations are in sync
- [ ] **T2.6** 🤖 Seed script: about 40 starter Indian dishes with ingredients, owned by a system "PlateCart Kitchen" user
- [ ] **T2.7** 🤖 Real data: `/templates` + `/templates/[id]` (list, search, filters, detail, fork)
- [ ] **T2.8** 🤖 Real data: `/my-templates` (created / forked tabs) and `/templates/new` publish
- [ ] **T2.9** 🤖 Real data: `/meal-plan` slot add, remove, and move, plus "Copy last week" and "Auto-fill week"
- [ ] **T2.10** 🤖 Real data: `/onboarding` writes the profile. Redirect first-time users there from `/dashboard`.
- [ ] **T2.11** 🤖 Real data: `/settings` (profile, preferences, delete account cascades all user rows)
- [ ] **T2.12** 🤖 Real data: `/budget` (month selector, ring, trends, waste) from `expenses` + `waste_log`
- [ ] **T2.13** 🤖 Real data: dashboard waste nudge posts to `/api/waste/log`. Compute "saved vs last month".
- [ ] **T2.14** 🤖 Clerk webhook handles `user.deleted`. Verify the svix signature in a test.
- [ ] **T2.15** 🤖 Replace mock sign-in and sign-up forms with Clerk `<SignIn/>` / `<SignUp/>` styled with the glass theme (the `appearance` prop)
- [ ] **T2.16** 🤖 Unit tests (Vitest) for validators and date helpers. API route tests against a Neon branch.
- [ ] **T2.17** 🌐 Playwright end-to-end test: sign up → onboarding → add 3 meals → shopping list → log expense → sign out/in → data still there
- [ ] **T2.18** 🌐 Production deploy with real keys, then a smoke test on the live URL

## Phase 3: Sharing
- [ ] **T3.1** 🤖 `users.username` (unique), `avatar_url`, `bio`, `city`. Username picker in onboarding.
- [ ] **T3.2** 🤖 Public profile `/u/[username]` with published dishes and menus
- [ ] **T3.3** 🤖 `plan_shares` table (`slug`, `meal_plan_id`, `visibility`). Public read-only page `/p/[slug]`.
- [ ] **T3.4** 🤖 "Copy to my week" from a shared plan
- [ ] **T3.5** 🤖 OG image route for share links (dish names, week, theme gradient)

## Phase 4: Menu marketplace
- [ ] **T4.1** 🤖 Schema: `menus` (`creator_id, title, description, period day|week|month, price, status draft|published|removed, cover_url, diet_type, tags, avg_rating, rating_count, sales_count`) and `menu_items` (`menu_id, day_index, meal_type, template_id`)
- [ ] **T4.2** 🤖 "Publish as menu" from a meal plan, choosing Day / Week / Month
- [ ] **T4.3** 🤖 `/market` listing: tabs for Day / Week / Month, filters (veg, price, rating, goal), and sort (top rated, new, best selling)
- [ ] **T4.4** 🤖 `/market/[id]` detail with a calendar preview, creator card, and reviews
- [ ] **T4.5** 🤖 "Get menu" (free) → `menu_purchases` row, then apply it to the user's calendar from a chosen start date
- [ ] **T4.6** 🤖 Ratings: `menu_ratings` (1–5 + review, unique per user + menu, only for buyers). Recalculate the average in a transaction.
- [ ] **T4.7** 🤖 Report listing / review, and an admin moderation page (role flag on `users`)
- [ ] **T4.8** 🤖 Creator dashboard: views, gets, rating, and earnings
- [ ] **T4.9** 🙋 Razorpay account, KYC, GST registration decision, terms of service, and refund policy
- [ ] **T4.10** 🤖 Razorpay checkout + webhook (`payment.captured` → purchase row), with idempotency
- [ ] **T4.11** 🙋/🤖 Creator payouts (Razorpay Route) and a platform fee setting

## Phase 5: Dine-out suggestions (later)
- [ ] **T5.1** 🤖 Schema: `restaurants` (`name, address, city, lat, lng, is_pure_veg, price_level, source`) and `restaurant_suggestions` (`user_id, restaurant_id, occasion, tags[] cost_effective|atmosphere|food|platter|veg, note`) plus `suggestion_votes`
- [ ] **T5.2** 🤖 "Suggest a place" form. Location comes from browser geolocation, with city as the fallback.
- [ ] **T5.3** 🤖 `/dine-out` list near me: distance (Haversine), tag filters, and vote ranking
- [ ] **T5.4** 🤖 Attach a restaurant to an eat-out slot on the calendar
- [ ] **T5.5** 🙋 Decide on Google Places (paid) vs OpenStreetMap (free) enrichment

## Phase 6: Swiggy (next phase)
- [ ] **T6.1** 🙋 Swiggy MCP partner access + OAuth client credentials
- [ ] **T6.2** 🤖 Restore the cart from `docs/later/SWIGGY_MCP_INTEGRATION.md`, using the shopping list as input
- [ ] **T6.3** 🤖 Swiggy Dineout as the data source for Phase 5

## Phase 7: Rebrand
- [ ] **T7.1** 🙋 Choose the name and colours
- [ ] **T7.2** 🤖 Apply them: tokens, logo, metadata, landing page, favicon, OG images, and the repo or package name

## Cross-cutting
- [ ] **TX.1** 🤖 Replace the in-memory rate limiter with Upstash (needs 🙋 keys)
- [ ] **TX.2** 🤖 Sentry error tracking (needs 🙋 DSN)
- [ ] **TX.3** 🤖 Image upload for dish and menu covers (Uploadthing or Cloudinary, needs 🙋 keys)
- [ ] **TX.4** 🤖 Accessibility pass (contrast on glass, focus rings, keyboard nav on the calendar)
- [ ] **TX.5** 🤖 Mobile layout pass for the meal-plan grid (day view under 640px)

---

### Suggested order
T1.1 → T1.2–T1.6 (Claude can do these now with no keys) → T2.1–T2.4 (Raphy) → T2.5–T2.18 → Phase 3 → Phase 4 (free) → T4.9–T4.11 → Phase 5.
