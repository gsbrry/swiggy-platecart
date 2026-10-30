# Backlog

Plan: [`ROADMAP.md`](ROADMAP.md) · Expert reviews: [`reviews/`](reviews/) · Updated 29 Oct 2026

**Owner:** 🤖 Claude can do it alone · 🙋 Raphy only (accounts, money, legal, product calls) · 🌐 Claude with browser/dashboard access

## Done (v1 build, Oct 2026)
- [x] Renamed to **Planetto**; appetite orange-red theme with a glass system (chrome = glass, content = solid) and AA-contrast tokens
- [x] Swiggy / Instamart / cart removed (parked in `docs/later/`)
- [x] Supabase project `planetto` (Mumbai) with schema, RLS on every table, RPCs, daily write caps, seed (47 dishes, 10 menus)
- [x] Real login: email + password, Google button, password reset, email-link callback; no demo mode
- [x] Onboarding (2 steps), week planner (desktop grid + mobile day view), dish picker with quick-add, eating out, copy last week, copy as text
- [x] Dishes: library, mine, community, detail, editor, copy, delete
- [x] Menus: share by link / publish to Market / private; Market with Day/Week/Month, diet filter, sort; menu page with "use this menu", ratings (users only), WhatsApp share, OG preview image
- [x] Shopping list scaled to household, tick-off, WhatsApp
- [x] Me: profile, preferences, my menus, menus used, sign out, delete account (DPDP erasure)
- [x] Reports + admin moderation queue
- [x] Security: Next 15.5 + React 19 upgrade (0 npm advisories), nonce CSP, security headers, no secrets in the app, open-redirect guard, input validation (zod + DB checks)
- [x] Tests: 11 unit, 26 Playwright UI (desktop + mobile), RLS + live API SQL tests; CI workflow

## Launch blockers
- [ ] 🙋 **Fix GitHub access** so the branch can be pushed (Claude GitHub App / reconnect GitHub)
- [ ] 🙋 Supabase → Authentication → URL configuration: set **Site URL** to the live domain and add `https://<domain>/auth/callback` to Redirect URLs
- [ ] 🙋/🌐 **Google sign-in**: create an OAuth client in Google Cloud, paste client ID/secret in Supabase → Auth → Providers → Google (until then the Google button shows an error)
- [ ] 🙋 **Custom SMTP** (e.g. Resend, Brevo; free tiers exist) in Supabase → Auth → SMTP. The built-in mailer only sends a few emails per hour — sign-up confirmations will stall without it
- [ ] 🙋 Turn on **leaked-password protection** and CAPTCHA (Turnstile, free) in Supabase Auth settings
- [ ] 🙋 Real **grievance email** and a lawyer's review of `/privacy` and `/terms` (placeholder `grievance@planetto.app` today)
- [ ] 🙋 Vercel: import the repo, set `NEXT_PUBLIC_SITE_URL=https://<domain>` for Production (see README → Deploy)
- [ ] 🙋 **Supabase Pro ($25/mo)** before real users: free projects pause after 7 days without activity
- [ ] 🙋 Make yourself admin (SQL in README) and decide who answers reports within 48 h

## Next (v1.1)
- [ ] 🤖 Public profile `/u/[username]` with published menus
- [ ] 🤖 "Auto-fill week" from diet + favourite dishes
- [ ] 🤖 Dish photos (Supabase Storage, signed uploads, ≤5 MB, no SVG)
- [ ] 🤖 Rating prompt the day after a used menu ends
- [ ] 🤖 Event tracking for launch metrics (activation, share rate, gets) — PostHog free tier or a Supabase table
- [ ] 🤖 Drag-and-drop / move meals between slots; keyboard grid navigation (one tab stop, arrow keys)
- [ ] 🤖 Dark mode (tokens already prepared)
- [ ] 🤖 Upstash rate limiting on auth/share pages (needs 🙋 free account)

## Later
- [ ] 🙋→🤖 Paid menus (Razorpay, creator KYC, GST) — only after the proof bar in `reviews/01-product-prd.md`
- [ ] 🤖 Dine-out suggestions by occasion (cost-effective, atmosphere, food, platter, veg) near the user
- [ ] 🤖 Budget / expenses, food-waste log, voice input, nutrition
- [ ] 🤖 Swiggy Instamart cart from the shopping list (`docs/later/SWIGGY_MCP_INTEGRATION.md`)
- [ ] 🤖 Regional languages
