# Planetto

A free weekly meal planner for Indian homes. Plan breakfast, lunch and dinner, get a shopping list sized for your household, share your week as a link, and copy ready-made Day / Week / Month menus from other home cooks (and rate them).

**Stack:** Next.js 15 (App Router, React 19) · Supabase (Auth + Postgres with Row Level Security) · Tailwind CSS · Vercel.

## Run it locally

```bash
npm ci
npm run dev        # http://localhost:3000, talks to the live Supabase project
```

The public Supabase URL and publishable key are committed in `.env.development` / `.env.production`. They are designed to be public: **Row Level Security** in the database decides what each user can read or write. There are no server secrets in this app.

To point at another Supabase project, copy `.env.example` to `.env.local`.

## Checks

| Command | What it does |
|---|---|
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm test` | Unit tests (Node test runner) for dates, shopping-list maths, redirect safety |
| `npm run test:e2e` | Playwright UI tests on desktop + mobile against `e2e/mock-supabase.cjs` (no network needed) |
| `npm run build` | Production build |
| `supabase/tests/*.sql` | Database tests: RLS rules (`rls_smoke.sql`) and the app's real API calls over HTTPS (`api_e2e.sql`) |

## How it's built

```
src/
  app/
    page.tsx                 landing
    (auth)/                  sign-in, sign-up, forgot/reset password (server actions)
    auth/callback, sign-out  OAuth / email-link landing, sign-out
    (onboarding)/onboarding  2-step setup (diet, exclusions, household, username)
    (app)/plan               week planner (desktop grid, mobile day view), share/publish
    (app)/dishes             library, my dishes, community; detail; create/edit
    (app)/market             public menus: Day / Week / Month, diet filter, sort
    (app)/m/[slug]           menu page: use it, rate it, share it, report it (+ OG image)
    (app)/list               shopping list from the plan
    (app)/me                 profile, preferences, my menus, delete account
    (app)/admin              moderation queue (admins only)
    (legal)/privacy, terms   drafts — get them reviewed before launch
  lib/actions/*              server actions (zod-validated, RLS-enforced)
  lib/supabase/*             SSR + browser clients, generated DB types
  middleware.ts              session refresh, route protection, nonce CSP + security headers
supabase/
  migrations/                schema, RLS, RPCs (applied to the live project)
  seed/build_seed.py → seed.sql   47 starter dishes + 10 starter menus
  tests/                     database tests
docs/
  ROADMAP.md, BACKLOG.md     plan and task list
  reviews/                   product, architecture, security, UX and QA/compliance reviews
```

**Key design choices**
- A **Menu** is one object for both sharing and the marketplace: visibility `private`, `link` (anyone with the link) or `public` (listed in Market). Menus are snapshots, so a creator editing a dish never changes someone else's week.
- Multi-row writes (create menu, use menu, copy dish, save dish) are Postgres functions, so they're atomic. Counters (uses, copies, ratings) are only written by the database.
- Only people who used a menu can rate it, once, and never their own.

## Deploy (Vercel)

1. Import the GitHub repo in Vercel (framework: Next.js, defaults are fine; Node 22).
2. Environment variable, **Production** only: `NEXT_PUBLIC_SITE_URL=https://<your-domain>`. The Supabase URL and publishable key come from the committed `.env.production`.
3. Supabase → Authentication → URL Configuration: Site URL = your domain; Redirect URLs = `https://<your-domain>/auth/callback` (and `https://*-<team>.vercel.app/auth/callback` if you want logins on preview deployments).

## Making someone an admin

```sql
insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
```

## History

This repo started as "PlateCart", a Swiggy Instamart cart builder. The Swiggy integration is parked in `docs/later/` for a future phase.
