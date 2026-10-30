# PRD: Standalone Meal Planner (v1)

> Author: Product Owner review panel, Oct 2026. Working name "PlateCart"; the app will be renamed.
> Inputs: `docs/ROADMAP.md`, `docs/BACKLOG.md`, `README.md`, `docs/SCREENS.md`, `src/app/**/page.tsx`.
> This PRD sets the launch scope. Where it disagrees with the roadmap, this document says so and why.

## 1. Problem

Indian households decide "what do we cook today?" two or three times a day, every day. The answer
usually comes from memory, a WhatsApp forward or a last-minute delivery order. That leads to the same
five dishes on repeat, extra grocery runs, and ordering in when nobody had a plan.

Recipe apps help with one dish. They don't help with the **week**. And the people who are good at
planning a week of food (a mother who runs a tight kitchen, a fitness coach, a Jain home cook) have
no simple way to hand that plan to someone else.

**What we're building:** a weekly meal calendar with your own dishes, plans you can share as a link,
and a marketplace where people publish ready-made Day, Week and Month menus that others can copy
into their own calendar and rate.

## 2. Target users

India, mobile-first (most sessions on Android phones, often shared over WhatsApp), English UI at launch.
- **Households**: 2–5 people, one person decides the meals, often with diet rules (veg, Jain, no onion or garlic).
- **Individuals**: working singles or couples who want to stop ordering in by default.
- **Creators**: home cooks, nutritionists and fitness coaches who already share meal plans informally.

## 3. Personas

**Priya, 34, Pune, "the household planner".** Plans food for a family of four, including a diabetic
father-in-law. Vegetarian, no onion or garlic on Tuesdays. Wants to plan Sunday night in 10 minutes
and send the week to the cook or her husband on WhatsApp. *Job: "Help me decide the week once, not 21 times."*

**Arjun, 27, Bengaluru, "the busy single".** Works in tech, orders in 5 nights a week, wants to eat
healthier and spend less. Won't build a plan from scratch. *Job: "Give me a good week I can just copy."*

**Meena, 45, Chennai, "the creator".** Runs a small Instagram page with South Indian diabetic-friendly
meals. Already sends weekly menus as images. *Job: "Let me publish my menus, get credit and ratings, and later earn from them."*

Priya and Arjun are the launch focus. Meena matters because the marketplace is empty without her,
so v1 must make publishing easy, but paying her waits.

## 4. Scope

### Principle
Launch is about one loop: **plan my week → share it → copy someone else's week → rate it.** Anything
that doesn't feed that loop waits.

### v1 MVP (launch)
1. **Real login**: Clerk with email + Google. No phone OTP (it costs money per SMS and adds no value at launch).
2. **Real database**: Neon + Drizzle migrations. Every page that ships reads and writes real data. Mock mode is for local demos only.
3. **Short onboarding** (2 steps): diet type + exclusions, household size, username. Then land on an empty week with a "Start from a menu" prompt.
4. **Weekly calendar**: 7 days × breakfast/lunch/dinner. Add, remove and move a dish. Mark a slot "eating out". "Copy last week". A day view on phones (under 640px) is required, not a polish item.
5. **Dishes** (today called "templates"): browse a starter library of about 40 Indian dishes, create your own (name, diet tag, ingredients, optional steps), copy (fork) any public dish.
6. **Share a plan**: one tap creates a read-only link (`/p/[slug]`) with a WhatsApp-friendly preview image and a "Copy to my week" button. Also "Copy as text" for WhatsApp.
7. **Marketplace (free only)**: publish a Day, Week or Month menu from your calendar. Browse by period, veg/non-veg, diet tag, rating. "Get menu" applies it to your calendar from a start date you choose.
8. **Ratings**: 1–5 stars + optional short review, one per user per menu, only after "Get menu".
9. **Basic safety**: report a menu or review, an admin page to hide it, and a grievance contact (needed for user-generated content in India).
10. **Seeded marketplace**: about 10 starter menus published by an in-house account so the first visitor never sees an empty market.
11. **New name and brand** applied before public launch (share links and preview images carry the brand, and changing it after people share links is costly).

### v1.1 (within 4–6 weeks of launch, if activation holds)
- Shopping list: merge ingredients for a day or week, check them off, share as text.
- Public creator profile `/u/[username]` and simple creator stats (views, gets, average rating).
- Auto-fill a week from your diet preferences.
- Search and sort improvements in the marketplace ("most copied this week").
- Dish photos (image upload).

### Later (v2+)
- **Paid menus** (₹19–₹199) with Razorpay, creator KYC, GST and payouts. Only when there is proof: for example 50+ menus with 20+ ratings each and creators asking to charge.
- **Dine-out suggestions** by occasion (cost-effective, atmosphere, food, platter, veg) near the user, starting with user-submitted places.
- Budget and expense tracking, food-waste logging.
- Voice input.
- Nutrition totals.
- Swiggy / Instamart cart (input = the v1.1 shopping list).
- Regional languages.

### Roadmap items I'm challenging (scope creep for launch)
| Roadmap item | Call | Why |
|---|---|---|
| T1.4 expenses table + `/budget` real data (T2.12) | **Cut from v1** | Budget tracking is a different product. It was there to show Instamart spend; with no cart it has no data source except manual entry, which few users do. |
| T1.5 voice "add to plan", T2.13 waste nudge | **Cut from v1** | Nice demo, not part of the core loop. Hide the UI. |
| T1.2/T1.3 shopping list | **Move to v1.1** | Valuable, but not a founder must-have. v1 gets "Copy as text", which covers the WhatsApp case. |
| T4.8 creator dashboard, T4.9–T4.11 payments | **Later** | Payments are a business (KYC, GST, refunds, terms), not a feature. Free first. |
| T0.3/T0.4 glass pass, dark mode | **Cut** | The rebrand will redo visuals anyway. |
| T2.6 seed only dishes | **Expand** | Also seed starter menus. An empty marketplace kills the launch. |
| Phase 3 vs Phase 4 as separate systems | **Merge** | A shared plan and a published menu are the same object with different visibility (see section 5). Build one, not two. |
| Phase 7 rebrand "last" | **Pull forward** | Must ship before launch for the reasons above. |
| Onboarding 5 steps (goal, diet, household, budget, exclusions) | **Shrink to 2** | Goal and budget don't change anything in v1. Every extra step loses sign-ups. |

## 5. One key product decision: "Menu" is the single sharing object

A **Menu** is a snapshot of dishes laid out over 1, 7 or ~28 days. It has a visibility:
- **Private**: only me (the default when I save a week as a menu).
- **Link**: anyone with the link can view and copy it (this is "share a plan").
- **Public**: listed in the marketplace, can be rated.

"Share plan" and "Publish menu" are the same action with a different visibility choice. Copying always
makes a **snapshot** into the user's own calendar and dishes, so later edits by the creator don't change
anyone's week. This halves the build and removes a class of bugs.

## 6. Core user flows

### 6.1 Sign-up → onboarding → first plan (goal: first plan in under 3 minutes)
1. Landing page → "Start planning free".
2. Sign up with Google or email (Clerk).
3. Onboarding step 1: diet (veg / non-veg / egg / vegan / Jain) + exclusions (onion, garlic, etc.).
4. Onboarding step 2: household size + username (pre-filled from name).
5. Land on **This week** (empty) with two options: "Start from a popular menu" or "Add my own dishes".
6a. Start from a menu → pick one from a short list filtered by their diet → choose start date → week fills.
6b. Add my own → tap an empty slot → search dishes (diet-filtered) → tap to add. Repeat.
7. Success state: "Your week is planned. Share it?" → share sheet.

### 6.2 Create a dish
1. From any empty slot or the Dishes tab → "New dish".
2. Enter name, meal type(s), diet tag. Optional: ingredients (name, quantity, unit), steps, cook time.
3. Save → dish is private by default; toggle "Public" to let others find it.
4. If opened from a slot, the dish goes straight into that slot.
Note: only the name and diet tag are required. A dish without ingredients is fine in v1.

### 6.3 Share a plan
1. On the week view → "Share".
2. Choose range: this day / this week.
3. App creates a link-visibility menu and opens the phone share sheet (WhatsApp first) with a preview image showing the week.
4. Recipient opens the link → read-only week → "Copy to my week" → sign-up if needed → copied after sign-up (don't lose the intent).
5. Alternative: "Copy as text" for a plain WhatsApp message.

### 6.4 Publish a menu
1. On the week view (or the Menus tab) → "Publish to marketplace".
2. Choose period: Day, Week or Month (Month = 4 consecutive weeks from the calendar).
3. Add title, short description, diet tag, up to 3 tags (e.g. "diabetic-friendly", "high-protein", "quick").
4. Preview the listing → "Publish". Price is fixed at Free in v1 (show "Paid menus coming soon").
5. Basic checks before listing: no empty days, at least 1 dish per day, title not empty. Listing is live immediately; reports can hide it.

### 6.5 Get + rate a menu
1. Marketplace → tabs Day / Week / Month → filter by diet, tag; sort by top rated or new.
2. Open a menu → calendar preview, creator name, rating, reviews.
3. "Get menu" → choose start date → confirm overwrite or fill-empty-slots-only → dishes copied into my calendar and my dishes.
4. After the menu's period starts (or immediately after 24 hours), prompt: "How was Meena's week?" → 1–5 stars + optional review.
5. One rating per user per menu; editable. Creators can't rate their own menus.

## 7. Success metrics (first 8 weeks after launch)

| Metric | Definition | Launch target |
|---|---|---|
| Activation | % of sign-ups who fill ≥ 7 slots within 24 hours | ≥ 40% |
| Week-2 retention | % of activated users who plan any slot in their 2nd calendar week | ≥ 30% |
| Week-4 retention | same, 4th week | ≥ 20% |
| Share rate | % of activated users who create a share link | ≥ 15% |
| Share-to-sign-up | sign-ups that come from a share link or menu page | ≥ 20% of all sign-ups |
| Marketplace use | % of activated users who "Get" at least one menu | ≥ 35% |
| Supply | public menus by non-staff users | ≥ 50 by week 8 |
| Rating coverage | % of gets that lead to a rating | ≥ 10% |
| Quality guard | reported menus hidden within 48 hours | 100% |

**North star:** weekly planners (users who plan ≥ 7 slots in a calendar week).
Instrument these from day one (simple event table or PostHog). No dashboard is needed at launch.

## 8. Open business decisions for the founder (critical only)

1. **The new name**, before launch, including a domain. It blocks share images, landing copy and store listings.
2. **Auth + DB stack.** Recommendation: keep Clerk + Neon (already coded, about 2 days faster than moving to Supabase).
3. **Paid menus: when and how much.** Recommendation: free at launch; decide paid only after the "proof" bar in section 4 is met. Decide the platform fee (e.g. 15–20%) and whether you'll register for GST before building payments.
4. **Who moderates?** Public menus and reviews need someone to review reports within 48 hours, plus a named grievance officer. Decide who that is at launch.
5. **Who seeds supply?** The 10 starter menus and the first 20 creators need to come from somewhere (your network, paid nutritionists, Instagram cooks). This is a launch task, not an engineering task.
6. **Month menus at launch?** Recommendation: yes, but as 4 weeks stitched together, no new screens. If creators don't publish them in 4 weeks, hide the tab.

## 9. Screens for v1 (prioritized)

| # | Screen | Route (proposed) | Existing route | Action |
|---|---|---|---|---|
| 1 | Week planner (app home) | `/plan` | `/meal-plan` + `/dashboard` | **Merge.** The week is the home screen. Today's meals become the top of the week view. Remove budget ring, waste nudge, voice FAB. |
| 2 | Sign in / Sign up | `/sign-in`, `/sign-up` | same | **Keep.** Real Clerk components styled to brand. |
| 3 | Onboarding | `/onboarding` | same | **Shrink** 5 steps to 2 (diet + exclusions; household + username). |
| 4 | Dish picker (sheet on the planner) | in `/plan` | template picker modal | **Keep**, add "New dish" inline. |
| 5 | Marketplace | `/market` | none | **New.** Day / Week / Month tabs, filters, sort. |
| 6 | Menu detail | `/market/[id]` and `/p/[slug]` | none | **New.** One component for both public listings and shared links: calendar preview, creator, ratings, "Get / Copy to my week". |
| 7 | Publish / share sheet | modal on `/plan` | none | **New.** Visibility: private / link / public; period; title; tags. |
| 8 | Dishes | `/dishes` | `/templates` + `/my-templates` | **Merge.** One page with tabs: Library / Mine / Copied. Rename "templates" to "dishes" in the UI. |
| 9 | Dish detail | `/dishes/[id]` | `/templates/[id]` | **Keep, simplify.** Drop nutrition and "Add to Instamart". Keep servings toggle, ingredients, steps, "Add to plan", "Copy". |
| 10 | Create / edit dish | `/dishes/new` | `/templates/new` | **Keep, simplify.** Only name + diet required. Drop the budget sidebar. |
| 11 | My menus | `/menus` | none | **New, small.** Menus I've shared, published or got, with links and ratings. |
| 12 | Settings | `/settings` | same | **Keep, simplify.** Profile, diet, delete account. Remove Swiggy row, notifications, budget. |
| 13 | Landing | `/` | same | **Rewrite** for the new name and the plan → share → marketplace story. No Swiggy/Instamart claims. |
| 14 | Admin moderation | `/admin/reports` | none | **New, minimal.** List reports, hide/unhide. Staff only. |

**Cut from v1:**
- `/cart`: delete (page, `components/cart`, `api/cart/*`, `lib/swiggy-mcp.ts`). Park the Swiggy doc under `docs/later/`.
- `/budget`: hide from nav and routes until "Later". Keep the code on a branch if wanted.
- `/dashboard`: merged into `/plan`. Redirect `/dashboard` to `/plan`.
- `/my-templates`: merged into `/dishes`. Redirect.
- Voice button, waste nudge, budget card: remove from all screens.

**Screens needing mockups before build:** Marketplace, Menu detail, Publish sheet, My menus, mobile day view.

## 10. Out of scope reminders

No payments, no restaurant data, no grocery ordering, no nutrition maths, no regional languages, no native app
in v1. A responsive web app that works well on a mid-range Android phone over WhatsApp links is the launch target.
