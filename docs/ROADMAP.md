# PlateCart Roadmap: standalone meal planner

> The source of truth for product direction. It replaces the Swiggy-first plan in
> [`DEVELOPER_TASKS.md`](DEVELOPER_TASKS.md), which stays only as history.
> The task list lives in [`BACKLOG.md`](BACKLOG.md).

## Where the app is today (Oct 2026)

| Area | Reality |
|---|---|
| Login | **Real Clerk login is already coded.** The "dummy" login is *mock mode*, which switches on only because `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing (`src/lib/mock.ts`). Adding the keys turns real login on. |
| Database | Drizzle schema for 7 tables exists (`src/db/schema.ts`). No migrations have been generated or run. Neon is not provisioned. |
| Pages on real data | Only **2 of 12** pages read the DB in real mode (`/dashboard`, `/meal-plan`). The other 10 only render mock data, so they would show fake data even after login works. |
| Swiggy / cart | It is spread through 19 files: the `/cart` page, `api/cart/*`, `lib/swiggy-mcp.ts`, the "Add to Instamart" buttons, the voice "order", budget spend from `orders_log` (source `instamart`), and the landing copy. |
| Theme | Appetite theme (orange to red, frosted glass) is now applied through CSS tokens in `src/app/globals.css`. A rebrand later only touches that file and `tailwind.config.ts`. |

**Conclusion:** "real login" takes about a day. "Real data everywhere" is the actual project.

---

## Phases

### Phase 0: Appetite glass theme (done in this branch)
- Orange `#F26419` with a red `#E63946` tint, `--sw-appetite` gradient for primary actions.
- `.glass`, `.glass-strong`, `.bg-appetite`, and `.text-appetite` utilities. Warm radial page background.
- Honours `prefers-reduced-transparency`.

### Phase 1: Standalone planner (remove Swiggy and cart)
Goal: the app makes sense with no delivery partner.
- Delete the cart page, the cart APIs, and the MCP client. Park the Swiggy docs under `docs/later/`.
- Replace "Add to Instamart" with a **Shopping list**: ingredients for the day or week merged across meals, checkable, and copyable or shareable as text (WhatsApp).
- Budget: replace the Instamart-derived spend with **manual spend entries** (groceries / eat-out).
- Voice: "Voice order" becomes "Voice add to plan".
- Rewrite the landing page, metadata, and onboarding copy with no Swiggy or Instamart claims.

### Phase 2: Real login and database
Goal: a real person signs up, and everything they do persists.
- Clerk (email + Google sign-in), Neon Postgres, and Drizzle migrations.
- Replace mock reads on all 10 mock-only pages with DB queries. Mock mode stays for local demo and tests only.
- Clerk webhook for `user.created`, `user.updated`, and `user.deleted`.
- Seed a starter library of about 40 Indian dishes so new users don't see an empty app.
- Playwright end-to-end test of the golden path against a real test user.

### Phase 3: Sharing
- Public profile (`/u/[username]`) and a public share link per plan (`/p/[slug]`) with an OG preview image.
- "Copy to my week" (fork) from any shared plan.

### Phase 4: Menu marketplace
- A **Menu** is a packaged plan: **Day**, **Week**, or **Month**.
- Creators publish menus as free or paid (small amount, for example ₹19–₹199).
- Buyers get the menu applied to their calendar.
- **Ratings and reviews** (1–5 stars + text). Only buyers or users who copied the menu can rate.
- Creator dashboard: sales, rating, and earnings. Report and moderate listings.
- Payments: Razorpay. **Launch with free menus first** and add payments once ratings prove demand (see the risk note).

### Phase 5: Dine-out suggestions (later)
- Users suggest restaurants for an occasion with tags: **cost-effective, atmosphere, food quality, platter, pure veg**.
- Location: browser geolocation plus the city from the user's profile. Filter by distance and tags. Upvotes rank suggestions.
- Optional later: enrich with Google Places / OpenStreetMap data.
- Plugs into the existing "eat-out" slots on the calendar.

### Phase 6: Swiggy integration (next phase)
- Bring back Instamart cart building and Swiggy dine-out using `docs/later/SWIGGY_MCP_INTEGRATION.md`.
- The shopping list from Phase 1 becomes the input to the cart. No redesign is needed.

### Phase 7: Rebrand
- New name and colours. Tokens are already centralised. Also update `layout.tsx` metadata, the logo in `app-nav.tsx`, the landing page, and the favicon.

---

## Decisions Raphy needs to make

1. **Auth + DB stack.** *Recommended: keep Clerk + Neon.* The code is already written for them, so this is the fastest path. The alternative is Supabase (auth + DB + storage in one place, which Claude can provision through its connector). That means rewriting middleware and `current-user.ts`, which costs about 2 extra days.
2. **Paid menus at launch, or free first?** *Recommended: free first.*
3. **Sign-in methods:** email + Google (recommended), plus phone OTP? Phone OTP costs money per SMS.
4. **Hosting:** stay on Netlify (current build fix targets it) or move to Vercel.

## Risks worth knowing

- **Selling menus is a payments business, not a feature.** Paying creators needs Razorpay Route or payouts, creator KYC (PAN), GST handling on platform fees, refunds, and a terms of service. Plan for this, or keep menus free and add tipping later.
- **Ratings get gamed.** Allow only buyers or users who copied a menu to rate, one rating per user, with a report button.
- **Restaurant data has a cost.** Google Places is billed per request. Starting with user-submitted suggestions avoids that.
