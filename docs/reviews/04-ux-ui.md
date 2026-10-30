# 04 — UX / UI review (Creative Direction, UX, user flow)

Reviewer role: Creative Director + UX/UI + user-flow.
Build reviewed: `af21805` (appetite theme) plus in-flight working-tree edits, mock mode, `next dev -p 3200`.
Method: every route screenshotted with Playwright (Chromium) at 1280×800 and 390×844, full page; source read for the root cause of each visual bug; WCAG contrast computed for every theme pair; Impeccable detector run over `src/app` + `src/components` (0 findings, so everything below came from looking at the pages and reading the code).
Note: a rename to "Planetto" was landing in the working tree while I worked. Screenshots still say "PlateCart" in places, and the source now mixes both names (see §1.0).

---

## 0. Verdict in one paragraph

The appetite theme reads as warm and food-like at first glance, and it is a big step up from the Swiggy-orange clone. But it is applied as **one material everywhere**: every card, input, chip, table and toolbar is the same peach-tinted glass on a peach gradient. The result is low-contrast mush with no hierarchy between "page", "card", "control" and "primary action". Three things block shipping: (1) **the app has no navigation at all below 768px**; (2) **the weekly planner, the core screen, collapses to a 70px-wide sliver on phones**; (3) **the signature orange fails WCAG for both white-on-orange buttons and orange text links**. On top of that, the IA still describes a Swiggy cart companion: "Add ingredients to Instamart" sits on every meal card. Fix the material system and the nav first. Everything else is iteration.

### Heuristic score (Nielsen, 0–4)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Disabled and enabled buttons look the same (Publish, Save changes, Continue). Budget pill is good. |
| 2 | Match with real world | 2 | "Templates" for dishes, "Fork" for copying a recipe, "Voice Order" when nothing is ordered. |
| 3 | User control & freedom | 2 | No mobile nav means no way back except the browser. Onboarding "Back" is nearly invisible. |
| 4 | Consistency & standards | 1 | Four container widths, two charcoals, three button heights, orange used for links, CTAs, selection, data *and* warnings. |
| 5 | Error prevention | 2 | Form placeholders ("20", "80") look like real values. Inputs with an orange tint read as error state. |
| 6 | Recognition over recall | 2 | Planner rows labelled B/L/D. Template cards have no photos, so every dish looks identical. |
| 7 | Flexibility & efficiency | 2 | Copy last week and Auto-fill are good. No keyboard shortcuts, no search outside Templates. |
| 8 | Aesthetic & minimalist | 2 | One gradient CTA per card means a wall of identical orange buttons on Templates (18+ per screen). |
| 9 | Error recovery | 2 | Toast "see console" is shown to users (cart-view). |
| 10 | Help & docs | 2 | Demo-mode explainer is good. No empty-state guidance anywhere. |
| | **Total** | **19/40** | Below average. The base is good; the system is not finished. |

---

## 1. Per-page issues

Severity: **P0** blocks ship · **P1** major · **P2** should fix · **P3** polish.

### 1.0 Global (every authenticated page)

- **P0: No mobile navigation.** `AppNav` renders section links with `hidden md:flex` and has no fallback. At 390px the header shows only logo, bell and avatar. Users cannot reach Meal Plan, Templates or Budget except through in-page links. See §2 for the bottom-tab fix.
- **P0: Orange contrast fails WCAG AA.** Measured:
  - White on `#FF8A1F` (gradient start) is **2.36:1**.
  - White on `#F26419` is **3.18:1**.
  - Orange text `#F26419` on the page bg `#FFF3EA` is **2.91:1**. This covers every "Edit plan →", "See all", "Details →" and "Full plan →" link (13px), and the active nav item.
  - Fix: add `--ink-orange: #C2410C` (4.75:1 on page) for all orange *text*. Re-stop the button gradient at `#D9480F → #C92A3B` (white text measures 4.30–5.42; use ≥15px semibold on the lighter end) or put text on solid `#CF3D1F` (4.84).
- **P1: Glass on glass on glass.** Cards are `.glass`, the inputs inside them are tinted glass, and the chips and stat tiles inside those are tinted again. Everything is peach on peach, so there is no figure/ground. The spec in §4 fixes this with surface levels and opaque controls.
- **P1: Disabled states use the enabled colour.** "Publish template" keeps the full gradient with dark grey text: unreadable *and* it looks clickable. "Save changes", onboarding "Continue" and the preview "+ Add to plan" are pale peach and look disabled even when they are not. Define one disabled token: neutral fill at 40% opacity with `cursor-not-allowed`, never the gradient.
- **P1: `background-attachment: fixed` on `body`.** iOS Safari ignores it and repaints the radial gradients on scroll. Full-page captures show a hard seam about 845px down on every mobile page. Paint the gradient on a `position: fixed; inset: 0; z-index: -1` layer instead.
- **P1: Glass breaks absolute-positioned icons.** On `/templates` the search icon is in the DOM (`template-browser.tsx:138`) but invisible: the input after it creates a `backdrop-filter` stacking context and paints over it. Expect the same bug anywhere an icon is layered before a glass input. Put icons after the input in the DOM or give them `z-10`.
- **P2: Two charcoals.** The CSS token is `--sw-charcoal: #2b1d1a` (warm), but `tailwind.config.ts` sets `charcoal: #282C3F` (Swiggy's blue-grey). Pick the warm one and delete the other.
- **P2: Four container widths.** Dashboard and Budget use 1100, Templates and Meal Plan use 1200 and nearly full-bleed, Settings uses about 712, and the nav uses 1100. Content jumps sideways between tabs. Standardise on `max-w-[1200px] px-4 md:px-6` and use a narrower 720 column only for forms.
- **P2: Brand name split.** Running source now mixes "Planetto" (`brand/logo.tsx`, metadata, onboarding, settings) and "PlateCart" (`AppNav` wordmark, sign-in header, `<title>` on app pages, which is just "PlateCart" with no page name). Route every string through `APP_NAME` and give each page `"<Page> · <App>"` titles.
- **P2: Emoji as UI** (👋, 🌅 ☀️ 🌙, 💡) next to lucide line icons. Pick one icon language. Keep the wave if you like it, and drop the meal-slot emoji for lucide `Sunrise/Sun/Moon`.
- **P3: Notification bell has a permanent unread dot** and goes nowhere. Hide it until notifications exist.

### 1.1 `/` Landing

- **P1: Copy is all Swiggy.** "with the grocery cart already loaded on Instamart", "Works with Instamart", "Instamart cart • 14 items", the step "Your cart fills itself… Swiggy Instamart cart", the feature "Instamart cart in one tap", and the testimonial "one Instamart order". Reposition around **plan → cook → share**: "Plan the week. Share the menu. Cook without the chaos." Make step 2 "Your shopping list writes itself", feature 2 "Shopping list in one tap", and add a feature for "Publish your menu".
- **P1: Fabricated social proof.** The stats "340+ recipes", "~₹1,200 avg monthly saving" and named testimonials ("Ananya, 29 · Bengaluru") are invented. Mark them as illustrative or remove them before any public launch (legal and trust risk).
- **P2: The hero preview card** is the most product-specific thing on the page but sits off to the side. On mobile it lands below the fold after three CTAs. Show it right after the headline on mobile, or crop it to a 3-row peek.
- **P2: Section rhythm.** Five centred "eyebrow + H2 + 3-up cards" sections in a row, all with identical cards. Break the pattern: make "How it works" a horizontal timeline, use a real food photo band, and replace the stat row with one bold claim.
- **P3: The "See the demo" ghost button** is white glass on a pale gradient and nearly disappears. Give it a 1px `--ink-orange` border.

### 1.2 `/sign-in`, `/sign-up`

- **P2: Two competing primaries.** "Log in as demo user" (solid charcoal) and "Continue to dashboard" (gradient) have equal weight. In production the demo button should not exist. In mock mode, make it secondary (outline) and keep the gradient for the real submit.
- **P2: The demo-mode explainer shows the env var name** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to users. Fine for local development, but never in a deployed preview. Gate it on `NODE_ENV==='development'`.
- **P3: Phone tab** in sign-in, but sign-up has no phone option. Keep them consistent.
- **P3: On desktop the card floats** in an empty peach field. Fill the left half with the plan preview card or a food image to sell the product at the moment of commitment.

### 1.3 `/onboarding`

- **P1: The disabled "Continue" and "Back" are almost invisible** (peach on peach, about 1.3:1). The user doesn't know what to do. Preselect the most common goal so Continue is live from the start, or show an enabled-looking Continue that explains what's missing when tapped.
- **P1: "2,847 users chose Lose Weight last month"** is fabricated, and steering a health goal with social proof is a dark pattern. Remove it.
- **P2: On mobile the "Your plan preview" panel shows "Select a goal"** and pushes Continue below the fold. Hide the preview on mobile until a goal is chosen, then show it as a collapsible peek.
- **P2: The final step says "Confirm your Instamart order"** (onboarding-flow.tsx:1310). Change it to "Review your shopping list".
- **P3: Five steps is long** for a planner. Merge household size and budget, and make exclusions skippable inline.

### 1.4 `/dashboard`

- **P1: "Add ingredients to Instamart" appears three times above the fold** as full-width gradient CTAs. It dominates the screen and points to a deprecated integration. Replace it with one "Today's shopping" summary chip, and make each meal card's primary action **"Start cooking"** or **"Swap"**.
- **P1: "Voice Order" in the hero.** Nothing is ordered any more. Rename it to "Add by voice" and demote it to a secondary icon button. The hero's real job is answering "what am I eating today and what do I need to do".
- **P2: Meal cards say "From template"** with generic tags (breakfast, veg, quick). Show a dish photo, prep time and kcal instead. "From template" is system language.
- **P2: The week strip's "today" cell is a full gradient block**, the loudest element on the page. Use an outlined, ink-orange today marker and keep the gradient for actions only.
- **P2: "Saved vs last month" shows "—" in green.** Empty data should not be coloured as a win. Use muted text: "Not enough data yet".
- **P2: The insight card copy** "Your next Instamart order will have a smaller quantity" should become "We'll suggest less coriander on your next shopping list".
- **P3: On mobile the hero takes 240px** to say hello. Compress it to one line plus a chip.

### 1.5 `/meal-plan` (core screen)

- **P0: The grid collapses on mobile.** In `meal-plan-board.tsx` the grid and the 270px right panel sit in a `flex gap-3.5` row with no breakpoint, so at 390px the 7-day grid gets about 70px and shows one clipped letter per column. Fix: below `lg`, stack the layout and switch the grid to a **day view** (horizontal day chips plus a vertical list of B/L/D slots for the selected day, swipe between days). The right panel becomes a collapsible "Nutrition · Shopping" sheet.
- **P1: The header toolbar wraps** on mobile ("Copy last week" splits into three lines and the week label breaks). Move Copy and Auto-fill into an overflow menu or icon buttons on mobile.
- **P1: "Add to Instamart cart"** becomes **"Generate shopping list"**, linking to the new Shopping list screen.
- **P2: Row labels "B / L / D"** with tiny icons. Use the full words on desktop and icons with tooltips only where space is tight.
- **P2: Empty "Add meal" cells are 10px pink-on-pink text** (about 1.4:1). They need to be visible and tappable: a dashed outline in `--ink-muted` with a 44px target.
- **P2: Each cell shows kcal and time split** across three lines ("10 / min"). Truncate the dish name to two lines and put the meta on one line, or drop time in week view.
- **P3: The nutrition bar chart's inactive bars are grey-brown**, which reads as disabled. Use the orange tint for them and the solid colour for today.

### 1.6 `/templates` (becomes **Dishes**)

- **P1: The search icon is invisible** (glass stacking bug, §1.0).
- **P1: Every card has a full gradient "+ Add to plan".** That's 18 or more identical orange buttons per screen, so nothing stands out. Make the whole card the link to dish detail, and use a small icon button (`+`) in the corner for quick-add.
- **P1: No imagery.** Every card shows the same pale cup or fork placeholder, so dishes are indistinguishable. Dish photos are the product here. Until real photos exist, use a deterministic generated cover: cuisine colour plus a large dish initial, or an illustrated icon set per category.
- **P2: Rails repeat the same dishes.** "Oats & Fruit Porridge" appears in four of five rails. Dedupe across rails, or switch to filter chips and a single grid.
- **P2: On mobile the filter chips are clipped** behind the Sort/List/Grid cluster at about 210px. Put chips in their own horizontally scrolling row with edge fade, and move Sort and view toggle to row 2 or a sheet.
- **P2: Rail headers wrap** ("Community favourites See all" collides). Hide the subtitle below `sm`.
- **P3: The green dot** in each card's corner (veg marker) has no legend. Use the Indian FSSAI veg/non-veg square symbol, which users recognise instantly.

### 1.7 `/templates/new` (becomes **New dish** and Publish flow)

- **P1: The "Publish template" disabled state** is a gradient with grey text: unreadable, and it looks live. See §1.0.
- **P1: Placeholders look like values.** Prep time "20" and ingredient qty "80" are placeholders but styled like entered text. Use "e.g. 20" in muted text.
- **P1: The ingredient row on mobile** squeezes the name input to about 90px ("e.g. Yellow m"). Stack it: name on its own row, qty and unit plus remove on the second.
- **P2: Inputs are filled orange-tint with orange borders**, which reads as an error state. Use opaque white inputs with a neutral border and an orange focus ring (§4).
- **P2: "Search from Instamart catalog"** and the subtitle "ingredients become an Instamart cart" become "Search ingredients" and "ingredients go straight to your shopping list".
- **P2: The live preview is far below the form on mobile.** Use a sticky "Preview" pill at the bottom that opens a sheet.
- **P3: The Public/Private toggle uses solid charcoal** for the selected state, a one-off style. Use the standard segmented control.

### 1.8 `/my-templates` (merges into **Dishes → Mine** and Profile)

- **P2: The "New template" button wraps to two lines** on mobile. Use an icon + "New" or a FAB.
- **P2: Card height jumps** between forked and created cards (an extra "Forked from" line). Reserve the line or move attribution into the meta row.
- **P2: No empty state.** A new user sees nothing. Add an illustration with "You haven't saved any dishes yet" and two CTAs: "Create a dish" and "Browse Market".
- **P3: The kebab menu has an 18px hit area.** Make it at least 40px.

### 1.9 `/budget`

- **P1: The KPI tiles stretch to the donut's height** (about 200px of empty glass each). Align them to the top with content height, or lay out donut + 3 tiles in a 2×2.
- **P1: Transactions are dated "Jul 12–28"** while the selector says "Oct 2026". Mock data must match the selected month or show "No transactions this month".
- **P1: Sources are "Instamart / Dineout".** Generalise to "Groceries / Eating out" with merchant as free text. Users log their own spend.
- **P2: On mobile the month selector** sits beside a wrapping subtitle and pushes it into a narrow column. Give the selector its own row.
- **P2: The category bar uses orange and yellow**, and orange is also the CTA colour. Data colours should not reuse the action colour (see §4.7).
- **P3: Waste insights** is buried at the very bottom. It belongs on the Dashboard or Shopping list, where the user can act on it.

### 1.10 `/settings` (becomes **Profile → Settings**)

- **P1: "Save changes" looks disabled even when it isn't**, and each section has its own Save. Auto-save toggles and chips with an inline "Saved ✓" confirmation, and keep an explicit Save only for profile text fields.
- **P2: "2 exclusions selected" while only "Onion & Garlic" looks selected.** Either the second selected chip is not styled, or the count is stale. Verify.
- **P2: Sign out sits inside the Profile card** next to Name/Email. Move it to the bottom of the page, by Delete account.
- **P2: Health-goal tiles on mobile** wrap to three lines ("Lose / Weight / Calorie-controlled"). Use a 1-column list on mobile.
- **P2: The read-only email field** is styled as a normal tinted input. Show it as plain text with a "Change" link.
- **P3: The "About · Build: Mock preview"** block is developer info. Hide it outside development.

---

## 2. Information architecture and navigation (v1)

### 2.1 Proposed sitemap

```
/                         Landing (public)
/m/[slug]                 Public menu share page (public, no auth)
/u/[handle]               Public profile (public)
/sign-in, /sign-up, /onboarding

App (auth)
├── /today                Dashboard: "what am I eating and what do I do now"
├── /plan                 Plan: week calendar (desktop grid / mobile day view)
│   └── /plan/[date]      Day detail (mobile deep link)
├── /dishes               Dishes: my dishes + saved + all (was /templates, /my-templates)
│   ├── /dishes/new
│   └── /dishes/[id]      Dish detail (recipe, ingredients, steps, add to plan)
├── /market               Market: browse published menus (weekly plans by others)
│   ├── /market/[id]      Menu detail with ratings, reviews, "Use this menu"
│   └── /market/publish   Publish-menu flow (3 steps)
├── /list                 Shopping list (generated from Plan)
├── /budget               Budget
└── /me                   Profile: public profile, my published menus, settings
    └── /me/settings
```

Key IA decisions:
- **Dish ≠ Menu.** A *dish* is one recipe. A *menu* is a published week (or N-day) plan made of dishes. "Template" goes away as user-facing language.
- **Market is for menus, not dishes.** Dish discovery lives inside Dishes ("All" tab). Market is the social layer: people share whole weeks, and others rate and adopt them.
- **The shopping list replaces the cart.** It is generated from Plan, grouped by aisle, checkable in-store, and shareable as text or WhatsApp. If an Instamart or other deep-link integration returns later, it becomes a secondary "Order online" button here and nowhere else.
- **Budget stays top-level on desktop but moves under Profile on mobile** (see the tab bar below). It is a weekly check-in, not a daily destination.

### 2.2 Desktop / tablet nav (≥768px)

Sticky top bar, `glass-strong`, 60px:

`[Logo]   Today · Plan · Dishes · Market · List · Budget          [⌕ search] [₹ budget pill] [avatar ▾]`

- Active item: ink-orange text plus a 2px underline (not a filled pill). Inactive items: `--ink-muted`, AA-compliant.
- The avatar menu holds Profile, Settings and Sign out. The bell is hidden until notifications ship.
- The global search (⌘K) covers dishes, menus and ingredients.
- Seven items is the maximum. If it feels crowded at 768–1024px, fold Budget into the avatar menu.

### 2.3 Mobile bottom tab bar (<768px)

Five tabs, fixed bottom, `glass-strong`, 64px plus `env(safe-area-inset-bottom)`, icon (24px) and label (11px, never icon-only):

| Tab | Icon (lucide) | Route | Notes |
|---|---|---|---|
| **Today** | `Sun` | `/today` | default after login |
| **Plan** | `CalendarDays` | `/plan` | |
| **Market** | `Store` | `/market` | discovery + social |
| **List** | `ShoppingBasket` | `/list` | badge = unchecked item count |
| **Me** | avatar | `/me` | Profile, my dishes, published menus, Budget, Settings |

- **Dishes on mobile:** reached from Plan ("Add meal" opens the dish picker sheet), Market, and Me → My dishes. A sixth tab is too many on a 390px screen.
- The top bar on mobile shrinks to the page title (left) and a contextual action (right): "Auto-fill" on Plan, "Share" on List, "Publish" on Me.
- Active tab: ink-orange icon and label plus a 4px dot above. Inactive tabs: `--ink-muted`.
- Hide the tab bar on onboarding, publish flow steps, and when the keyboard is open.
- Pages get `pb-[calc(64px+env(safe-area-inset-bottom)+16px)]`.

### 2.4 Core loop the nav must serve

`Today → (gap in week?) → Plan → add from Dishes or adopt a Market menu → List → shop → cook → rate / publish → Market`

Every screen should make the next step in this loop one tap away: Plan footer leads to "Generate list", a finished week leads to "Publish this week as a menu", and Market detail leads to "Use this menu".

---

## 3. New screens

### 3.1 Market listing (`/market`)

- **Header:** title "Market" with the sub "Weekly menus from home cooks". A search field below (full width on mobile).
- **Filter row** (horizontally scrolling chips): diet (Veg, Egg, Non-veg, Jain, Vegan), goal, budget band (₹ per person per week), days (3/5/7), cuisine region. "Sort" sits at the end: Top rated · Trending · Newest · Cheapest.
- **Featured band:** one large editorial card ("This week's pick") with a cover collage of 4 dish photos, menu name, creator avatar and handle, rating ★4.7 (312), ₹/week, and diet badge.
- **Grid:** 1 column on mobile, 2 on tablet, 3 on desktop. **Menu card:**
  - Cover: 2×2 photo collage of the menu's dishes (signals "a week of food", unlike a single dish card).
  - Title (2 lines max), creator chip (avatar + @handle).
  - Meta row: ★ rating · uses count · days · ₹/person/week.
  - Diet badge (FSSAI square) top-left on the cover, and a save (bookmark) icon top-right.
  - The whole card is the link. No CTA button on the card.
- **Empty or filtered-to-zero:** "No menus match. Clear filters" plus "Be the first: publish your week".
- **Card surface:** level-1 glass with an opaque image area. Ratings use `--ink` text with a yellow star, not orange.

### 3.2 Menu detail with ratings (`/market/[id]`)

- **Hero:** cover collage (desktop: left 60%; mobile: full-bleed 240px) with title, creator row (avatar, name, @handle, Follow), and stats (★4.7 · 312 ratings · 1.2k uses · 7 days · ₹1,850/person/week · ~1,450 kcal/day avg).
- **Primary action, sticky on mobile:** **"Use this menu"**. It opens a sheet that asks for a start week, household size (prefilled) and Replace or Fill gaps, with a preview of conflicts. Secondary actions: Save, Share.
- **Tabs:** *Week* · *Shopping list* · *Reviews*
  - *Week*: read-only version of the Plan grid (desktop) or day-by-day accordion (mobile). Each dish links to dish detail.
  - *Shopping list*: aggregated ingredients, scaled to *your* household size, with estimated total.
  - *Reviews*: a rating summary (big ★ average with a 5→1 histogram), then filter chips (Most helpful, Recent, With photos), then the review list (avatar, stars, date, "cooked 5/7 days", text, optional photos, Helpful count). Write-review CTA: users can rate only after they have used the menu for at least 1 day (prevents drive-by ratings, which matters for trust).
- **"Why people like it" tags**, aggregated from reviews: "Kid friendly", "Great for meal prep", "Budget".
- **More from @creator** rail at the bottom.

### 3.3 Publish-menu flow (`/market/publish`)

Entry points: Plan ("Share this week"), Me ("Publish a menu"), and the end-of-week prompt on Today.
Full-screen flow, tab bar hidden, a 3-step progress bar, and a sticky footer with Back / Next.

1. **Pick the days.** Week grid preview of the source week with toggles per day (publish 3, 5 or 7 days). Eat-out slots and empty slots are flagged: "3 empty slots: fill or skip".
2. **Describe it.** Title (with a suggestion from the content, e.g. "Jain Weeknight Veg · ₹1.8k"), a short description (140 chars), auto-detected tags (diet, goal, cuisine) the user can edit, and a cover chosen from a generated collage or an uploaded photo. Visibility: Public (Market) · Unlisted (link only) · Private.
3. **Review & publish.** The card exactly as it will appear in Market (a live preview, *above the fold* on mobile), plus a checklist: "All dishes have ingredients ✓", "No private dishes ✓ (or: 2 dishes are private; they'll be published with this menu)". Primary button: "Publish menu".

**Success screen:** confetti-free, calm. "Your menu is live", followed by Copy link, Share to WhatsApp, and View in Market. Then an inline preview of the public share page.

### 3.4 Shopping list (`/list`)

- **Header:** "Shopping list", with the range "Mon 26 Oct – Sun 1 Nov · 7 days · 2 people" and an edit-range control. Right: Share (text/WhatsApp) and an overflow menu (Clear checked, Print).
- **Summary strip:** item count, estimated cost, and a budget delta ("₹420 under your weekly budget").
- **List**, grouped by aisle (Vegetables, Dairy, Grains & dal, Spices, Other), each group collapsible with a count. Each row has:
  - A 44px checkbox, the ingredient name, and the aggregated quantity in human units ("500 g moong dal", "1 bunch coriander").
  - Muted secondary text naming the dishes that use it ("Poha, Khichdi").
  - Swipe left to mark "Already have" (moves to a collapsed "In pantry" section).
  - A waste-insight hint inline when relevant: "You wasted coriander 3× last month · we suggest ½ bunch".
- Checked items animate to the bottom of their group with strike-through, and the list persists offline.
- **Add item** field pinned at the bottom (above the tab bar) for non-recipe items.
- **Empty state:** "Your list builds itself from your plan", with "Plan this week" and "Use a Market menu".
- **Surfaces:** the list sits on opaque `surface-solid` (it's used in a shop, often outdoors in bright light, so readability beats glass).

### 3.5 Public share page (`/m/[slug]`, no auth)

- Lightweight, fast, and OG-image friendly: no app chrome, just the logo top-left and "Open in app" / "Sign up free" top-right.
- **Hero:** collage cover, title, creator, rating, ₹/week, diet badge.
- **Body:** the week as a clean day-by-day list (dish name, small photo, kcal). The shopping-list total is teased but gated: "See the full shopping list, scaled to your household: sign up free".
- **Sticky bottom CTA:** "Use this menu". Logged-out users go to sign-up and then land back on the "Use this menu" sheet with intent preserved.
- **Reviews:** top 3 shown, plus "See all on [App]".
- **Generated OG image** (1200×630): collage, title, rating, and app wordmark. This is the main growth surface on WhatsApp and Instagram, so design it as a first-class asset.
- **Unlisted menus:** `noindex`, no Market link.

### 3.6 Profile (`/me`, public view `/u/[handle]`)

- **Header card:** avatar (large), name, @handle, one-line bio, diet badge, and counts (Menus published · Total uses · Avg rating · Followers). On your own profile, "Edit profile" sits next to Settings (gear icon). On others' profiles, "Follow" and "Share".
- **Tabs:** *Menus* (published, grid as in Market) · *Dishes* (created, public ones on others' view; all plus a Private badge on own) · *Saved* (own view only).
- **Own-view extras** (mobile, since Budget and Settings live here): a list section with **Budget** (row with mini progress bar ₹6,170 / ₹12,000), **Meal preferences**, **Notifications**, **Privacy & data**, and **Sign out** at the bottom.
- **Empty states:** "No menus yet. Publish your first week" (links to the publish flow), and "Dishes you create appear here".

---

## 4. Glassmorphism system spec

Principle: **glass is chrome, not content.** It belongs on floating layers (nav, tab bar, sheets, popovers, hero preview) where something colourful sits behind it. Content that people read or type into sits on near-opaque surfaces. The current build inverts this, and that is why everything blurs together.

### 4.1 Background (the thing glass refracts)

- `--bg-base: #FFF6EF` (warm off-white, slightly lighter than now).
- Gradient field on a fixed pseudo-layer (not `background-attachment: fixed`):
  - `radial-gradient(42rem 34rem at 6% -8%, rgb(255 138 31 / .28), transparent 60%)`
  - `radial-gradient(38rem 30rem at 100% 6%, rgb(230 57 70 / .20), transparent 60%)`
  - `radial-gradient(46rem 36rem at 50% 112%, rgb(255 176 102 / .26), transparent 60%)`
- Optional 2–3% SVG noise overlay to prevent banding on large flat areas.
- **The blobs only exist behind floating chrome.** In dense data areas (Plan grid, Budget table, List) they are covered by solid surfaces, so they cost nothing to readability.

### 4.2 Surface levels

| Level | Token | Fill | Blur | Border | Shadow | Use |
|---|---|---|---|---|---|---|
| **0 Canvas** | `--bg-base` + gradient | — | — | — | — | page |
| **1 Card** | `.surface` | `rgb(255 255 255 / .82)` | `blur(12px) saturate(140%)` | `1px rgb(255 255 255 / .8)` + inner `0 0 0 1px rgb(43 29 26 / .06)` | `0 1px 2px rgb(43 29 26 / .05), 0 8px 24px rgb(180 60 30 / .08)` | content cards, dish/menu cards |
| **1s Solid** | `.surface-solid` | `#FFFFFF` | none | `1px rgb(43 29 26 / .08)` | same as L1 | Plan grid, tables, forms, Shopping list |
| **2 Raised glass** | `.glass` | `rgb(255 255 255 / .60)` | `blur(18px) saturate(160%)` | `1px rgb(255 255 255 / .7)` top-lit: `inset 0 1px 0 rgb(255 255 255 / .7)` | `0 12px 32px rgb(180 60 30 / .12)` | hero preview, featured Market card, KPI hero |
| **3 Chrome** | `.glass-strong` | `rgb(255 250 246 / .78)` | `blur(24px) saturate(180%)` | bottom or top hairline `rgb(43 29 26 / .08)` | `0 1px 0 rgb(43 29 26 / .04)` | top nav, bottom tab bar, sticky footers |
| **4 Overlay** | `.glass-overlay` | `rgb(255 252 249 / .90)` | `blur(28px)` | `1px rgb(255 255 255 / .8)` | `0 24px 64px rgb(43 29 26 / .18)` | sheets, modals, popovers, toasts |
| Scrim | — | `rgb(43 29 26 / .32)` + `blur(4px)` | | | | behind modals and sheets |

Rules:
- **Never nest glass in glass.** Inside a glass or surface card, children are opaque (`#fff` or `--fill-subtle: #FBF4EF`) or transparent with a hairline. Chips, inputs and stat tiles are never blurred.
- **One raised-glass element per viewport** (L2). It is the signature moment. If everything is glass, nothing is.
- **Radius scale:** 8 (inputs, chips), 12 (cards), 16 (sheets, hero), full (pills, avatars). Today the build mixes 8/10/12/14/16 at random.

### 4.3 Colour roles (fixes the contrast failures)

| Token | Value | Use | Contrast on `#FFF6EF` |
|---|---|---|---|
| `--ink` | `#2B1D1A` | body, headings | ~15:1 |
| `--ink-muted` | `#6F5F5A` | secondary text | 5.5:1 |
| `--ink-faint` | `#8C7B75` | placeholder only, never info | ~3.9:1 (placeholder exempt) |
| `--ink-orange` | `#C2410C` | links, active nav, selected text | 4.75:1 |
| `--action` | gradient `#D9480F → #C92A3B` | primary buttons only | white 4.3–5.4:1 |
| `--action-solid` | `#CF3D1F` | small buttons, icon buttons | white 4.84:1 |
| `--tint-orange` | `rgb(242 100 25 / .10)` | selected chip/tile fill (with `--ink-orange` border) | |
| `--success` | `#2F7D32` | positive deltas, veg | ≥4.5:1 |
| `--warning` | `#B26A00` | over-budget warning text | ≥4.5:1 |
| `--danger` | `#B42318` | destructive | ≥4.5:1 |

- **The bright brand orange `#F26419` and `#FF8A1F` are now decorative only:** gradient blobs, the logo mark, illustration, large display text ≥32px bold (where 3:1 suffices).
- **Gradient text (`.text-appetite`)** only on display headlines of 32px or more. It fails contrast at the light end for anything smaller.

### 4.4 Controls on glass

- **Inputs:** opaque `#FFFFFF`, `1px rgb(43 29 26 / .14)` border, 44px height, 15px text. Focus is a `2px --ink-orange` ring with 2px offset. Never tinted orange (that reads as error). Errors use a `--danger` border with a message below.
- **Buttons:**
  - Primary: gradient, white 15px/600.
  - Secondary: white fill, `--ink` text, hairline border.
  - Tertiary: text in `--ink-orange`.
  - Disabled: `--fill-subtle` with `--ink-faint` text, no gradient, no shadow.
  - Heights: 36 / 44 / 52 only. Minimum touch target is 44×44.
- **Chips:** unselected chips are transparent with a hairline. Selected chips get `--tint-orange` fill, an `--ink-orange` border and text, and a check icon (selection must not rely on colour alone).
- **One primary per view region.** Card grids get no primary buttons; the card itself is the target.

### 4.5 When NOT to use glass

- Dense data: the Plan grid, tables, the Budget transaction list, charts. Use `.surface-solid`.
- Forms longer than 3 fields (`/dishes/new`, settings, publish step 2).
- The Shopping list (used in shops and bright daylight).
- Anything over photos or busy imagery without a scrim. Text on glass over a photo needs `--glass-overlay` (≥0.9) or a gradient scrim.
- Long-reading content (recipe steps, reviews).
- Low-end Android: detect with `@supports not (backdrop-filter: blur(1px))` and on `prefers-reduced-transparency` swap every glass level to its opaque equivalent (already started in globals.css; extend it to all levels).
- Lists longer than about 20 blurred items on screen: blur cost scales with area. Profile the Plan and Market grids on a mid-range Android phone and keep total blurred area to roughly 2 layers per viewport.

### 4.6 Accessibility checklist for the system

- All text ≥4.5:1 against the **worst case** behind the glass. Test glass surfaces over the most saturated blob, not over white.
- Non-text UI (borders of inputs, chips, focus rings) ≥3:1.
- Never convey state with tint alone. Add an icon, weight or underline.
- Support `prefers-reduced-transparency` (opaque surfaces), `prefers-reduced-motion` (no parallax on blobs, no animated gradients), and `prefers-contrast: more` (solid surfaces plus 1.5px borders).
- Visible focus on every interactive element, including cards used as links.
- Dark mode: out of scope for v1, but define tokens so it's a token swap: dark canvas `#1A1210`, glass `rgb(40 28 24 / .6)`, keep `--ink-orange` light variant `#FF9A5C`.

### 4.7 Data-viz colours

Do not reuse the action gradient for chart series. Groceries `#D9480F`, eating out `#E0A100`, other `#8C7B75`, and a remaining or empty track of `rgb(43 29 26 / .08)`. Donuts and bars carry direct labels, so the legend is not the only key.

### 4.8 Type

DM Sans is fine and friendly. Fix the scale. Today there are 9 ad-hoc sizes (10, 11, 12, 13, 15, 17, 19 px and so on). Proposed:

`12 (meta) · 14 (secondary) · 16 (body) · 18 (card title) · 22 (section) · 28 (page title) · 40/56 (display)`

Use 600 for titles and 700 only for numbers and display. Raise the mobile body size to 16px (currently 13–14 in many places), which also prevents iOS input zoom.

---

## 5. App name ideas

Brief: appetite + plan + share menus, short, pronounceable across Indian languages, plausible .com/.in. Availability was **not checked**; verify on a registrar before committing.

| Name | Why it fits | Domain angle |
|---|---|---|
| **Thali** | A thali is literally a planned, shareable set menu. Instantly Indian and warm, and pairs well with "Share your thali". | `thali.app`, `getthali.com`, `thali.in` (likely taken; try `mythali.in`) |
| **Menuly** | "Menu" + friendly suffix. Says "make and share menus" with zero explanation. | `menuly.com`, `menuly.in` |
| **Platewise** | Plan smart (budget and nutrition) plus plate. Calm and trustworthy for the budget angle. | `platewise.com`, `platewise.in` |
| **Weekplate** | The product's unit is a week of plates. Descriptive, and it supports SEO ("weekplate jain menu"). | `weekplate.com`, `weekplate.in` |
| **Khaana** | Hindi/Urdu for "food". Short and affectionate. Strong in India, but less clear abroad. | `khaana.app`, `khaana.in` |

Recommendation: **Thali** if the product stays India-first (the metaphor carries the whole "planned, shared set menu" idea). **Menuly** if international reach matters. Note: "Planetto", currently landing in the source, reads as "planet" and loses the food signal. If it is kept, the wordmark has to bring the appetite.

---

## 6. Top fixes (ordered)

1. **P0: Add the mobile bottom tab bar** (Today · Plan · Market · List · Me). There is no mobile nav today.
2. **P0: Rebuild Plan for mobile as a day view.** The 7-column grid collapses to about 70px next to a fixed side panel at 390px.
3. **P0: Fix orange contrast.** Add `--ink-orange #C2410C` for text and links, and darken the button gradient to `#D9480F → #C92A3B`. White on the current gradient measures 2.4–3.2:1.
4. **P1: Introduce surface levels.** Glass only for nav, tab bar, sheets and one hero element. Cards are near-opaque. Inputs, chips and tables are opaque white. No glass in glass.
5. **P1: Purge Swiggy/Instamart/Dineout copy** across about 11 UI files. "Add to Instamart" becomes "Generate shopping list", and "Voice Order" becomes "Add by voice".
6. **P1: Make disabled states unambiguous.** Neutral fill and faint text, never the gradient. Today "Publish template" is unreadable and "Save changes" looks dead when it is live.
7. **P1: Remove the CTA wall on Dishes/Templates.** The card becomes the link with a small `+` quick-add. Add generated covers until real photos exist, and dedupe rails.
8. **P1: Fix glass rendering bugs.** The search icon is hidden under the backdrop-filter stacking context, and `background-attachment: fixed` seams and repaints on iOS.
9. **P1: Remove fabricated social proof** ("2,847 users", testimonials, savings stats) and fix mock-data dates (Budget shows July transactions under October).
10. **P2: Unify brand and tokens.** One app name through `APP_NAME` (PlateCart/Planetto are mixed today), one charcoal (CSS `#2B1D1A` vs Tailwind `#282C3F`), one 1200px container, and a 7-step type scale.
