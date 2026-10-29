# Review 02: Architecture, database and API

Panel role: software architect, database and API reviewer.
Scope: the stack decision (Supabase vs Clerk + Neon), the v1 Postgres schema with RLS, the API surface, and what to delete from the current code.
Inputs read: `docs/ROADMAP.md`, `docs/BACKLOG.md`, `src/db/schema.ts`, `src/db/index.ts`, `src/lib/*`, `src/middleware.ts`, all 14 files under `src/app/api/**`, and the pages that import `@/lib/mock`.

---

## 1. Stack verdict and migration from Clerk

**Switch to Supabase (Auth + Postgres + Storage). Use `@supabase/ssr` + `supabase-js` as the only data path, with RLS as the primary authorization layer. Drop Drizzle, Neon, Clerk and svix.**

This reverses ROADMAP decision 1 ("keep Clerk + Neon"). Three things justify the change:

1. **Almost nothing is sunk.** Neon was never provisioned and there are no users or migrations. Only 2 of 12 pages read the DB. Of the 14 API routes, 3 are Swiggy or mock-only, and the budget, template and plan routes need rewriting anyway because the schema changes (expenses, menus, date-aware slots). The ~2 extra days in the roadmap estimate are mostly spent on code we would rewrite regardless.
2. **The builder can do the setup itself.** The Supabase connector can create the project, apply migrations, run security advisors, generate TypeScript types and fetch the URL and publishable key. **v1 then needs no server secret at all**, because every request runs as the signed-in user and RLS enforces access. With Clerk + Neon, Raphy has to create two accounts and paste four secrets (Clerk publishable, secret and webhook keys, plus `DATABASE_URL`), and we have to keep a sync webhook running.
3. **The product is now multi-tenant and has a public side.** Sharing, a marketplace, buyer-only ratings and moderation are access-control problems. RLS puts each rule in one place in the database, so it holds no matter which page, action or future mobile client runs the query. Today each rule lives as a hand-written `// RLS: filter by userId` comment in every route.

**Why not keep Drizzle on Supabase Postgres?** Drizzle connects as the `postgres` role, which **bypasses RLS**. Getting RLS back means wrapping every request in a transaction that runs `set local role authenticated` and sets `request.jwt.claims`. That wrapper is easy to skip by importing the wrong `db`. Drizzle also needs the DB password in `DATABASE_URL`, which is a secret the connector cannot hand us, and it needs Supavisor transaction pooling with `prepare: false` on Netlify functions. The two things Drizzle does better are transactions and typed joins. Postgres functions called with `rpc()` replace the transactions, and PostgREST embedding plus generated types replace the typed joins. *Fallback if the team insists on Drizzle:* use `drizzle-orm/postgres-js` against the pooler and only through an `rlsDb(claims)` wrapper, and add a lint rule that bans importing the raw client outside `src/server/admin/`.

**Steps that still need Raphy, so we don't oversell "fully autonomous":**
- **Google OAuth client.** Supabase has no shared dev credentials the way Clerk does. Raphy creates a client in Google Cloud Console and pastes its ID and secret into Supabase Dashboard → Auth → Providers.
- **Auth URLs.** Set the Site URL and the redirect allow-list: prod domain, `http://localhost:3000/**`, and the Netlify deploy-preview wildcard.
- **Custom SMTP before launch.** The built-in mailer is limited to a few emails per hour. Resend's free tier is enough.
- **Two public values in Netlify env:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Phase 4b only:** `SUPABASE_SECRET_KEY` for the Razorpay webhook.

**Risks and mitigations:**

| Risk | Mitigation |
|---|---|
| Free projects pause after 7 days idle | Move to Pro ($25/mo) at public launch; keep a cron ping until then |
| An RLS mistake leaks data | Run `get_advisors` (security) after every migration; add SQL policy tests (§2.9) to CI |
| `supabase-js` has no client-side transactions | Every multi-row write is a Postgres function (§3) |
| Vendor coupling | Low: it is plain Postgres plus SQL migrations; RLS policies are portable SQL |

### Migration steps from Clerk

No data migration is needed. Steps 1–7 and 9 are fully agent-doable.

1. **Provision (agent, connector).** `create_project` in region `ap-south-1` (Mumbai). Use two projects, `platecart-dev` and `platecart-prod`; the free tier allows 2. Run `get_project_url` and `get_publishable_keys` → write `.env.local`. Enable asymmetric JWT signing keys so the server can verify tokens locally with `auth.getClaims()`.
2. **Schema (agent).** Write SQL in `supabase/migrations/0001_init.sql` … (the §2 DDL), apply it with `apply_migration`, then run `get_advisors` for security and performance until both are clean. Run `generate_typescript_types` → `src/types/database.ts`, and add an `npm run db:types` script. **SQL migrations are the single source of truth.**
3. **Supabase clients.** Add `@supabase/ssr` and `@supabase/supabase-js`. Create:
   - `src/lib/supabase/server.ts`: `createServerClient` with `cookies().getAll/setAll`
   - `src/lib/supabase/browser.ts`: `createBrowserClient`
   - `src/lib/supabase/middleware.ts`: `updateSession`
   - `src/server/auth.ts`: `requireUser()`, which returns `{ supabase, userId }` or redirects or throws 401. It uses `getClaims()`, or `getUser()` if asymmetric keys are off. **Never** trust `getSession()` on the server.
4. **Rewrite `src/middleware.ts`.**
   - Call `updateSession` to refresh cookies.
   - Protect everything except `/`, `/login`, `/auth/*`, `/p/*`, `/u/*`, `/market` (read), `/api/webhooks/*`.
   - Keep the security headers. Update the CSP:
     - `connect-src`: `https://<ref>.supabase.co wss://<ref>.supabase.co`
     - `img-src`: `https://<ref>.supabase.co https://lh3.googleusercontent.com` (Google avatars)
     - `form-action`: `'self' https://<ref>.supabase.co https://accounts.google.com`. Otherwise Chrome blocks the redirect to Google that follows the sign-in form post.
     - Remove all `clerk.*` and `neon.tech` entries.
5. **Auth UI.** Add a single `/login` page with a "Continue with Google" button and an email one-time code or magic link. That means no passwords and no reset flow. Add `GET /auth/callback` (`exchangeCodeForSession`) and `GET /auth/confirm` (`verifyOtp`). Turn `sign-in/[[...]]` and `sign-up/[[...]]` into redirects to `/login`. The `on_auth_user_created` trigger (§2) creates `profiles` and `user_settings`, which replaces the Clerk webhook and the lazy insert in `getCurrentUser`.
6. **Remove Clerk.**
   - Dependencies: `@clerk/nextjs`, `svix`.
   - `<ClerkProvider>` in `src/app/layout.tsx`.
   - `src/app/api/auth/webhook/`.
   - `CLERK_*` env vars.
7. **Remove Neon and Drizzle.**
   - Dependencies: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`.
   - Files: `src/db/`, `drizzle.config.ts`.
   - Scripts: `db:generate`, `db:migrate`, `db:studio`. Replace them with `db:types`.
8. **Port pages and actions** to server components and server actions (§3), page by page (BACKLOG T2.7–T2.13). Seed about 40 dishes, owned by a "PlateCart Kitchen" system user, in `supabase/seed.sql`.
9. **Tests.** Add SQL RLS tests (§2.9) and a Playwright golden path against `platecart-dev`.
10. **Raphy:** Google OAuth client, auth URLs, SMTP and Netlify env, as listed above.

Backlog impact:
- **Shrink:** T2.2–T2.4 (one Google client plus two public values).
- **Delete:** T2.14 (Clerk webhook).
- **Replace:** TX.3 (Uploadthing/Cloudinary) with Supabase Storage.
- **Rename:** T2.15 becomes "Supabase `/login` page".

---

## 2. Target Postgres schema (v1)

Design rules:
- Every user FK points at `public.profiles(id)` (which equals `auth.users.id`), so PostgREST can embed the creator. Example: `dishes?select=*,owner:profiles(username)`.
- `user_id` columns default to `auth.uid()`. Clients never send it.
- Money is stored as **integer paise**. Calendar days are stored as **`date` in the user's timezone**, defaulting to `Asia/Kolkata`. The current budget route uses UTC month boundaries, which is wrong for IST users after 18:30 on the last day of a month.
- Plans are **weekly containers** (`week_start` is a Monday) holding **positioned slots**, so one meal can hold several dishes (dal + rice + roti). Day, week and month menus map onto 1, 7 or 28 consecutive days. A month is 4 weeks so weekdays stay aligned.
- Public and private profile data are split into **two tables**, because RLS works on rows, not columns.
- Counters that users must not write (ratings, sales, role) are protected with **column-level GRANTs** plus security-definer triggers.
- RLS policies call `(select auth.uid())`, which is evaluated once per statement. Every FK has an index (the Supabase advisor flags missing ones).
- Helper functions live in a `private` schema, which the Data API does not expose.

### 2.1 Extensions, schemas, enums

```sql
create extension if not exists pg_trgm with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
-- Policies call private.* helpers, so the API roles need usage + execute (the schema is still not exposed over PostgREST).
grant usage on schema private to anon, authenticated;
alter default privileges in schema private grant execute on functions to anon, authenticated;

create type public.goal              as enum ('loss','gain','maintain');
create type public.diet_type         as enum ('veg','eggetarian','nonveg','vegan','jain','keto','glutenfree');
create type public.meal_type         as enum ('breakfast','lunch','snack','dinner');
create type public.slot_kind         as enum ('dish','eatout','skip');
create type public.unit              as enum ('g','kg','ml','l','pcs','tsp','tbsp','cup','bunch','pinch','to_taste');
create type public.aisle             as enum ('produce','dairy','grains','pulses','spices','protein','bakery','oils','other');
create type public.visibility        as enum ('private','unlisted','public');
create type public.expense_category  as enum ('groceries','eatout','other');
create type public.waste_level       as enum ('none','some','most');
create type public.menu_period       as enum ('day','week','month');
create type public.menu_status       as enum ('draft','published','removed');
create type public.acquisition_kind  as enum ('free','paid');
create type public.payment_status    as enum ('created','captured','failed','refunded');
create type public.report_target     as enum ('menu','menu_rating','dish','profile');
create type public.report_reason     as enum ('spam','offensive','copyright','misleading','unsafe','other');
create type public.report_status     as enum ('open','actioned','dismissed');
create type public.user_role         as enum ('user','admin');

create function private.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create function private.short_id() returns text language sql volatile as $$
  select translate(encode(extensions.gen_random_bytes(9), 'base64'), '+/', '-_')  -- 12 chars
$$;
```

### 2.2 Users

```sql
-- Public face of a user (readable by anyone).
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 60),
  avatar_url   text check (char_length(avatar_url) <= 500),
  bio          text check (char_length(bio) <= 280),
  city         text check (char_length(city) <= 60),
  role         public.user_role not null default 'user',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Private preferences (owner only).
create table public.user_settings (
  user_id              uuid primary key references public.profiles(id) on delete cascade,
  goal                 public.goal,
  diet_type            public.diet_type,
  household_size       smallint not null default 1 check (household_size between 1 and 12),
  monthly_budget_paise integer check (monthly_budget_paise between 0 and 100000000),
  eatout_per_week      smallint not null default 0 check (eatout_per_week between 0 and 21),
  exclusions           text[]   not null default '{}' check (cardinality(exclusions) <= 50),
  timezone             text     not null default 'Asia/Kolkata',
  onboarded_at         timestamptz,
  updated_at           timestamptz not null default now()
);

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
          new.raw_user_meta_data->>'avatar_url');
  insert into public.user_settings (user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
$$;
```

### 2.3 Dishes (templates) and ingredients

```sql
-- Shared ingredient catalog so the shopping list can merge "Onion" and "onion ".
create table public.ingredients (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 80),
  name_key     text generated always as (lower(btrim(name))) stored unique,
  aisle        public.aisle not null default 'other',
  default_unit public.unit,
  created_by   uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index ingredients_name_trgm on public.ingredients using gin (name extensions.gin_trgm_ops);
create index ingredients_created_by on public.ingredients (created_by);

create table public.dishes (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  forked_from_id uuid references public.dishes(id) on delete set null,
  name           text not null check (char_length(name) between 1 and 100),
  description    text check (char_length(description) <= 1000),
  steps          text check (char_length(steps) <= 5000),
  meal_types     public.meal_type[] not null default '{}',
  diet_type      public.diet_type,
  tags           text[] not null default '{}' check (cardinality(tags) <= 20),
  servings       smallint not null default 2 check (servings between 1 and 20),
  prep_minutes   smallint check (prep_minutes between 0 and 600),
  image_path     text,                                   -- storage: dish-images/{uid}/{uuid}.webp
  visibility     public.visibility not null default 'private',
  fork_count     integer not null default 0,
  archived_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index dishes_owner        on public.dishes (owner_id, created_at desc);
create index dishes_public_feed  on public.dishes (created_at desc) where visibility = 'public' and archived_at is null;
create index dishes_tags         on public.dishes using gin (tags);
create index dishes_name_trgm    on public.dishes using gin (name extensions.gin_trgm_ops);
create index dishes_forked_from  on public.dishes (forked_from_id);

create table public.dish_ingredients (
  id            uuid primary key default gen_random_uuid(),
  dish_id       uuid not null references public.dishes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id),
  quantity      numeric(10,2) check (quantity > 0),      -- null = "to taste"
  unit          public.unit,
  note          text check (char_length(note) <= 80),    -- "finely chopped"
  position      smallint not null default 0,
  unique (dish_id, ingredient_id, unit)
);
create index dish_ingredients_ingredient on public.dish_ingredients (ingredient_id);
```

### 2.4 Menus (declared before slots because slots reference them)

```sql
create table public.menus (
  id                uuid primary key default gen_random_uuid(),
  creator_id        uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title             text not null check (char_length(title) between 3 and 80),
  description       text check (char_length(description) <= 2000),
  period            public.menu_period not null,
  day_count         smallint not null,
  price_paise       integer not null default 0,
  diet_type         public.diet_type,
  goal              public.goal,
  tags              text[] not null default '{}' check (cardinality(tags) <= 10),
  cover_path        text,                                  -- storage: menu-covers/{uid}/{uuid}.webp
  status            public.menu_status not null default 'draft',
  avg_rating        numeric(3,2) not null default 0,
  rating_count      integer not null default 0,
  acquisition_count integer not null default 0,
  published_at      timestamptz,
  removed_reason    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint menus_day_count check ((period = 'day' and day_count = 1) or (period = 'week' and day_count = 7)
                                 or (period = 'month' and day_count = 28)),
  constraint menus_published_at check (status = 'draft' or published_at is not null),
  -- Free first. Phase 4b drops this and adds: price_paise = 0 or price_paise between 1900 and 19900
  constraint menus_free_only check (price_paise = 0)
);
create index menus_creator      on public.menus (creator_id, created_at desc);
create index menus_feed_new     on public.menus (period, published_at desc)                       where status = 'published';
create index menus_feed_top     on public.menus (period, avg_rating desc, rating_count desc)      where status = 'published';
create index menus_feed_popular on public.menus (period, acquisition_count desc)                  where status = 'published';
create index menus_tags         on public.menus using gin (tags);
create index menus_title_trgm   on public.menus using gin (title extensions.gin_trgm_ops);

create table public.menu_items (
  id        uuid primary key default gen_random_uuid(),
  menu_id   uuid not null references public.menus(id) on delete cascade,
  day_index smallint not null check (day_index between 0 and 27),   -- < menus.day_count, checked in publish_menu()
  meal_type public.meal_type not null,
  position  smallint not null default 0 check (position between 0 and 9),
  kind      public.slot_kind not null default 'dish',
  dish_id   uuid references public.dishes(id) on delete no action,  -- NO ACTION (deferred to statement end) so account-delete cascades still work
  servings  smallint check (servings between 1 and 20),
  note      text check (char_length(note) <= 140),
  unique (menu_id, day_index, meal_type, position)
);
create index menu_items_dish on public.menu_items (dish_id);

-- Phase 4b; created now so acquisitions can reference it.
create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete restrict,
  menu_id             uuid not null references public.menus(id) on delete restrict,
  amount_paise        integer not null check (amount_paise > 0),
  razorpay_order_id   text not null unique,
  razorpay_payment_id text unique,                          -- idempotency key for the webhook
  status              public.payment_status not null default 'created',
  raw                 jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index payments_user on public.payments (user_id);
create index payments_menu on public.payments (menu_id);

create table public.menu_acquisitions (
  menu_id         uuid not null references public.menus(id) on delete cascade,
  user_id         uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind            public.acquisition_kind not null default 'free',
  amount_paise    integer not null default 0 check (amount_paise >= 0),
  payment_id      uuid unique references public.payments(id),
  acquired_at     timestamptz not null default now(),
  last_applied_at timestamptz,
  primary key (menu_id, user_id),
  constraint acq_paid_has_payment check ((kind = 'paid') = (payment_id is not null))
);
create index menu_acquisitions_user on public.menu_acquisitions (user_id, acquired_at desc);

create table public.menu_ratings (
  id         uuid not null default gen_random_uuid() unique,   -- target for reports
  menu_id    uuid not null,
  user_id    uuid not null default auth.uid(),
  stars      smallint not null check (stars between 1 and 5),
  review     text check (char_length(review) <= 1000),
  hidden_at  timestamptz,                                       -- set by moderation
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (menu_id, user_id),
  -- Buyer-only rating enforced by the database: no acquisition row, no rating.
  foreign key (menu_id, user_id) references public.menu_acquisitions(menu_id, user_id) on delete cascade
);
create index menu_ratings_feed on public.menu_ratings (menu_id, created_at desc) where hidden_at is null;
create index menu_ratings_user on public.menu_ratings (user_id);

-- Aggregates. SECURITY DEFINER because raters cannot update menus. Lock the row first;
-- in READ COMMITTED each plpgsql statement then sees committed concurrent ratings.
create function private.refresh_menu_rating() returns trigger
language plpgsql security definer set search_path = '' as $$
declare m uuid := coalesce(new.menu_id, old.menu_id);
begin
  perform 1 from public.menus where id = m for update;
  update public.menus set
    avg_rating   = coalesce((select round(avg(stars), 2) from public.menu_ratings where menu_id = m and hidden_at is null), 0),
    rating_count = (select count(*) from public.menu_ratings where menu_id = m and hidden_at is null)
  where id = m;
  return null;
end $$;
create trigger menu_ratings_agg after insert or update or delete on public.menu_ratings
  for each row execute function private.refresh_menu_rating();

create function private.bump_acquisition_count() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.menus set acquisition_count = acquisition_count + 1 where id = new.menu_id;
  return null;
end $$;
create trigger menu_acquisitions_count after insert on public.menu_acquisitions
  for each row execute function private.bump_acquisition_count();
```

### 2.5 Meal plans and slots

```sql
create table public.meal_plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),   -- Monday
  title      text check (char_length(title) <= 80),
  notes      text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start),
  unique (id, user_id)                                   -- target of composite FKs below
);

create table public.meal_slots (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid not null,
  user_id        uuid not null default auth.uid(),        -- denormalised for cheap RLS; kept honest by the composite FK
  day_index      smallint not null check (day_index between 0 and 6),
  meal_type      public.meal_type not null,
  position       smallint not null default 0 check (position between 0 and 9),
  kind           public.slot_kind not null default 'dish',
  dish_id        uuid references public.dishes(id) on delete set null,   -- null + kind='dish' renders as "dish removed"
  servings       smallint check (servings between 1 and 20),             -- null => user_settings.household_size
  note           text check (char_length(note) <= 140),
  source_menu_id uuid references public.menus(id) on delete set null,
  created_at     timestamptz not null default now(),
  foreign key (plan_id, user_id) references public.meal_plans(id, user_id) on delete cascade,
  unique (plan_id, day_index, meal_type, position)
);
create index meal_slots_user   on public.meal_slots (user_id);
create index meal_slots_dish   on public.meal_slots (dish_id);
create index meal_slots_menu   on public.meal_slots (source_menu_id);
```

### 2.6 Shopping list: **derived, with only user state stored**

Decision: compute the list from the plan on every read with `public.shopping_list(from, to)` (§3). Store only what the user adds: which items are checked off, and extra items not tied to a dish.

Why: plan edits show up instantly, there is no sync job and no stale rows, and the volume is tiny (≤ 28 slots × ~10 ingredients). Phase 6 (Instamart) uses the same function as its cart input.

```sql
create table public.shopping_list_marks (
  user_id      uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  period_start date not null,
  item_key     text not null check (char_length(item_key) <= 80),   -- '<ingredient_id>:<base_unit>' | 'extra:<id>'
  checked_at   timestamptz not null default now(),
  primary key (user_id, period_start, item_key)
);

create table public.shopping_list_extras (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  period_start date not null,
  name         text not null check (char_length(name) between 1 and 80),
  quantity     numeric(10,2) check (quantity > 0),
  unit         public.unit,
  created_at   timestamptz not null default now()
);
create index shopping_list_extras_user on public.shopping_list_extras (user_id, period_start);
```

### 2.7 Expenses, waste, shares, reports

```sql
create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  amount_paise integer not null check (amount_paise between 1 and 10000000),
  category     public.expense_category not null,
  note         text check (char_length(note) <= 140),
  spent_on     date not null default (now() at time zone 'Asia/Kolkata')::date,
  slot_id      uuid references public.meal_slots(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index expenses_user_day on public.expenses (user_id, spent_on desc);
create index expenses_slot     on public.expenses (slot_id);

create table public.waste_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  ingredient_id   uuid references public.ingredients(id) on delete set null,
  ingredient_name text not null check (char_length(ingredient_name) between 1 and 80),
  level           public.waste_level not null,
  logged_on       date not null default (now() at time zone 'Asia/Kolkata')::date,
  slot_id         uuid references public.meal_slots(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index waste_log_user_day        on public.waste_log (user_id, logged_on desc);
create index waste_log_user_ingredient on public.waste_log (user_id, ingredient_id);
create index waste_log_slot            on public.waste_log (slot_id);

create table public.plan_shares (
  id         uuid primary key default gen_random_uuid(),
  plan_id    uuid not null,
  user_id    uuid not null default auth.uid(),
  slug       text not null unique default private.short_id() check (slug ~ '^[A-Za-z0-9_-]{10,16}$'),
  visibility public.visibility not null default 'unlisted' check (visibility <> 'private'),
  view_count integer not null default 0,
  copy_count integer not null default 0,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (plan_id, user_id) references public.meal_plans(id, user_id) on delete cascade
);
create unique index plan_shares_one_active on public.plan_shares (plan_id) where revoked_at is null;
create index plan_shares_user on public.plan_shares (user_id);

create table public.reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid default auth.uid() references public.profiles(id) on delete set null,
  target_type     public.report_target not null,
  target_id       uuid not null,
  reason          public.report_reason not null,
  details         text check (char_length(details) <= 1000),
  status          public.report_status not null default 'open',
  resolved_by     uuid references public.profiles(id) on delete set null,
  resolved_at     timestamptz,
  resolution_note text check (char_length(resolution_note) <= 500),
  created_at      timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index reports_open     on public.reports (created_at) where status = 'open';
create index reports_target   on public.reports (target_type, target_id);
create index reports_resolver on public.reports (resolved_by);

-- updated_at triggers
create trigger t_profiles  before update on public.profiles      for each row execute function private.touch_updated_at();
create trigger t_settings  before update on public.user_settings for each row execute function private.touch_updated_at();
create trigger t_dishes    before update on public.dishes        for each row execute function private.touch_updated_at();
create trigger t_menus     before update on public.menus         for each row execute function private.touch_updated_at();
create trigger t_plans     before update on public.meal_plans    for each row execute function private.touch_updated_at();
create trigger t_ratings   before update on public.menu_ratings  for each row execute function private.touch_updated_at();
create trigger t_payments  before update on public.payments      for each row execute function private.touch_updated_at();
```

### 2.8 RLS, column grants, storage

```sql
-- Access helpers (SECURITY DEFINER avoids policy recursion; private schema = not callable over the API).
create function private.owns_dish(p uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.dishes where id = p and owner_id = (select auth.uid()))
$$;
create function private.owns_menu(p uuid, p_draft_only boolean default false) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.menus where id = p and creator_id = (select auth.uid())
                 and (not p_draft_only or status = 'draft'))
$$;
create function private.can_read_menu(p uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.menus m where m.id = p and (m.status = 'published' or m.creator_id = (select auth.uid())))
      or exists (select 1 from public.menu_acquisitions a where a.menu_id = p and a.user_id = (select auth.uid()))
      or private.is_admin()
$$;
-- A dish is readable if it is public/unlisted, mine, or part of a free published menu or a menu I acquired.
create function private.can_read_dish(p uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.dishes d where d.id = p
                 and ((d.visibility <> 'private' and d.archived_at is null) or d.owner_id = (select auth.uid())))
      or exists (select 1 from public.menu_items mi join public.menus m on m.id = mi.menu_id
                 where mi.dish_id = p and m.status = 'published' and m.price_paise = 0)
      or exists (select 1 from public.menu_items mi join public.menu_acquisitions a on a.menu_id = mi.menu_id
                 where mi.dish_id = p and a.user_id = (select auth.uid()))
$$;

alter table public.profiles             enable row level security;
alter table public.user_settings        enable row level security;
alter table public.ingredients          enable row level security;
alter table public.dishes               enable row level security;
alter table public.dish_ingredients     enable row level security;
alter table public.menus                enable row level security;
alter table public.menu_items           enable row level security;
alter table public.payments             enable row level security;
alter table public.menu_acquisitions    enable row level security;
alter table public.menu_ratings         enable row level security;
alter table public.meal_plans           enable row level security;
alter table public.meal_slots           enable row level security;
alter table public.shopping_list_marks  enable row level security;
alter table public.shopping_list_extras enable row level security;
alter table public.expenses             enable row level security;
alter table public.waste_log            enable row level security;
alter table public.plan_shares          enable row level security;
alter table public.reports              enable row level security;

-- profiles: public read; owner updates only whitelisted columns (role is not writable).
create policy profiles_read   on public.profiles for select to anon, authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant  update (username, display_name, avatar_url, bio, city) on public.profiles to authenticated;

-- user_settings: owner only. Rows come from the signup trigger.
create policy settings_read   on public.user_settings for select to authenticated using (user_id = (select auth.uid()));
create policy settings_update on public.user_settings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke update on public.user_settings from authenticated;
grant  update (goal, diet_type, household_size, monthly_budget_paise, eatout_per_week, exclusions, timezone, onboarded_at)
  on public.user_settings to authenticated;

-- ingredients: read all, insert own; no edits (catalog is append-only for users).
create policy ingredients_read   on public.ingredients for select to anon, authenticated using (true);
create policy ingredients_insert on public.ingredients for insert to authenticated with check (created_by = (select auth.uid()));

-- dishes
create policy dishes_read on public.dishes for select to anon, authenticated using (
  (visibility <> 'private' and archived_at is null) or owner_id = (select auth.uid()) or private.can_read_dish(id));
create policy dishes_insert on public.dishes for insert to authenticated with check (
  owner_id = (select auth.uid()) and fork_count = 0
  and (forked_from_id is null or private.can_read_dish(forked_from_id)));
create policy dishes_update on public.dishes for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy dishes_delete on public.dishes for delete to authenticated using (owner_id = (select auth.uid()));
revoke update on public.dishes from authenticated;
grant  update (name, description, steps, meal_types, diet_type, tags, servings, prep_minutes, image_path, visibility, archived_at)
  on public.dishes to authenticated;

create policy dish_ing_read  on public.dish_ingredients for select to anon, authenticated using (private.can_read_dish(dish_id));
create policy dish_ing_write on public.dish_ingredients for all to authenticated
  using (private.owns_dish(dish_id)) with check (private.owns_dish(dish_id));

-- menus: published are public; creators edit their own (not counters, not 'removed').
create policy menus_read on public.menus for select to anon, authenticated using (private.can_read_menu(id));
create policy menus_insert on public.menus for insert to authenticated
  with check (creator_id = (select auth.uid()) and status = 'draft');
create policy menus_update on public.menus for update to authenticated
  using (creator_id = (select auth.uid()) and status <> 'removed')
  with check (creator_id = (select auth.uid()) and status <> 'removed');
create policy menus_delete on public.menus for delete to authenticated
  using (creator_id = (select auth.uid()) and status = 'draft' and acquisition_count = 0);
revoke update on public.menus from authenticated;
grant  update (title, description, diet_type, goal, tags, cover_path, status) on public.menus to authenticated;
-- price_paise, period, published_at are set only by publish_menu(); counters only by triggers.

create policy menu_items_read  on public.menu_items for select to anon, authenticated using (private.can_read_menu(menu_id));
create policy menu_items_write on public.menu_items for all to authenticated
  using (private.owns_menu(menu_id, true))
  with check (private.owns_menu(menu_id, true) and (dish_id is null or private.can_read_dish(dish_id)));

-- acquisitions: own rows; free + published + not the creator. Paid rows only via the service role (webhook).
create policy acq_read   on public.menu_acquisitions for select to authenticated using (user_id = (select auth.uid()));
create policy acq_insert on public.menu_acquisitions for insert to authenticated with check (
  user_id = (select auth.uid()) and kind = 'free' and amount_paise = 0 and payment_id is null
  and exists (select 1 from public.menus m where m.id = menu_id and m.status = 'published' and m.price_paise = 0
              and m.creator_id <> (select auth.uid())));
revoke update on public.menu_acquisitions from authenticated;
grant  update (last_applied_at) on public.menu_acquisitions to authenticated;
create policy acq_update on public.menu_acquisitions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- no delete policy: prevents acquire -> rate -> delete -> re-acquire games

-- ratings: public read of visible ones; the FK already guarantees buyer-only.
create policy ratings_read   on public.menu_ratings for select to anon, authenticated
  using (hidden_at is null or user_id = (select auth.uid()));
create policy ratings_insert on public.menu_ratings for insert to authenticated with check (user_id = (select auth.uid()));
create policy ratings_update on public.menu_ratings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy ratings_delete on public.menu_ratings for delete to authenticated using (user_id = (select auth.uid()));
revoke update on public.menu_ratings from authenticated;
grant  update (stars, review) on public.menu_ratings to authenticated;

create policy payments_read on public.payments for select to authenticated using (user_id = (select auth.uid()));
-- no write policies: service role only

-- Owner-only tables (one policy each).
create policy own_plans   on public.meal_plans for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_slots   on public.meal_slots for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (dish_id is null or private.can_read_dish(dish_id)));
create policy own_marks   on public.shopping_list_marks  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_extras  on public.shopping_list_extras for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_expense on public.expenses  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_waste   on public.waste_log for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_shares  on public.plan_shares for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- Anonymous share pages never touch plan_shares directly; they call get_shared_plan(slug) (§3).

create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open' and resolved_by is null);
create policy reports_read   on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or private.is_admin());
-- resolution only through moderate_report() (SECURITY DEFINER, checks is_admin)

-- Storage: three public-read buckets; users write only under their own {uid}/ folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars',     'avatars',     true, 1048576, array['image/webp','image/jpeg','image/png']),
  ('dish-images', 'dish-images', true, 3145728, array['image/webp','image/jpeg','image/png']),
  ('menu-covers', 'menu-covers', true, 3145728, array['image/webp','image/jpeg','image/png']);

create policy storage_own_insert on storage.objects for insert to authenticated with check (
  bucket_id in ('avatars','dish-images','menu-covers') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy storage_own_update on storage.objects for update to authenticated using (
  bucket_id in ('avatars','dish-images','menu-covers') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy storage_own_delete on storage.objects for delete to authenticated using (
  bucket_id in ('avatars','dish-images','menu-covers') and (storage.foldername(name))[1] = (select auth.uid())::text);
```

Notes:
- Paid menus (Phase 4b) need two extra things:
  - `menu_items_read` must hide dish IDs from non-buyers. Serve the preview through `get_menu_preview()`, which returns dish names only.
  - Published menus need snapshots (`menu_versions`), so a creator's later edits don't change what a buyer paid for.
  In v1, every menu is free and published menus are immutable: `menu_items_write` requires a draft.
- Phase 5 (restaurants) is out of v1. When it comes, add `postgis` with `geography(Point)` and a GiST index instead of Haversine in SQL.

### 2.9 RLS tests (CI, run against the dev project)

```sql
-- For each table: as user A, insert; as user B, select/update/delete must affect 0 rows.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '<user-b-uuid>', 'role', 'authenticated')::text, true);
select count(*) from public.expenses;           -- expect 0 of A's rows
insert into public.menu_ratings (menu_id, stars) values ('<menu-not-acquired>', 5);  -- expect FK violation
update public.profiles set role = 'admin' where id = '<user-b-uuid>';                 -- expect permission denied
```

---

## 3. API surface

### Where each kind of endpoint belongs

| Use | Mechanism | Why |
|---|---|---|
| **Reads for our own pages** | **Server Components** query Supabase directly (`createClient()` from `@/lib/supabase/server`) | No API hop, streamed, cacheable per request; RLS applies because the client carries the user's cookie |
| **Mutations from our UI** | **Server Actions** (`src/server/actions/*.ts`) | Typed end to end, built-in Origin check (CSRF), progressive-enhancement forms, `revalidatePath` in the same call, no `fetch` or JSON boilerplate |
| **Anything an outside system calls, a GET redirect, or a cacheable public GET** | **Route Handlers** | Webhooks need a raw body and signature; OAuth needs a GET redirect target; OG images need a URL |
| **Multi-row writes, aggregates** | **Postgres functions via `supabase.rpc()`**, called from actions or server components | One transaction (`supabase-js` has none); logic lives next to RLS |

Rules for server actions:
- Every action is a public POST endpoint. Each one starts with `const { supabase, userId } = await requireUser()` and `schema.parse(input)`.
- Actions return `{ ok: true, data } | { ok: false, error, fieldErrors? }` and never throw for validation errors.
- Never use actions for reads or polling. They are POST-only and run one at a time per client.
- Rate-limit voice parsing, publishing and reporting. Keep `lib/rate-limit.ts` until Upstash arrives (TX.1).

**All 14 current `/api/*` routes are deleted.** Each is replaced by the item below or removed with Swiggy.

### 3.1 Route Handlers (the complete list)

| Method | Path | Auth | Input | Output |
|---|---|---|---|---|
| GET | `/auth/callback` | public | `?code&next` (`next` must match `^/[^/]`) | 302 to `next`, or `/onboarding` if `onboarded_at` is null |
| GET | `/auth/confirm` | public | `?token_hash&type(email\|magiclink\|signup)&next` | 302 |
| GET | `/p/[slug]/opengraph-image` | public | slug | PNG via `ImageResponse` (week grid, dish names) |
| GET | `/u/[username]/opengraph-image` | public | username | PNG |
| POST | `/api/webhooks/razorpay` *(4b)* | HMAC `X-Razorpay-Signature` | raw body | 200. Uses the service-role client. Upserts `payments` on `razorpay_payment_id`, then inserts a `menu_acquisitions(kind='paid')` row. Idempotent. |
| GET | `/api/health` | public | none | `{ ok, db: boolean }` |

### 3.2 Postgres functions (RPC)

All are `security invoker` unless marked. Run `revoke execute ... from public, anon` on each, then grant to `authenticated`; the exception is `get_shared_plan`, which `anon` also needs.

| Function | Returns | Notes |
|---|---|---|
| `ensure_plan(p_week_start date)` | `uuid` | `insert … on conflict (user_id, week_start) do nothing returning id`, then select |
| `create_dish(p jsonb)` / `update_dish(p_id uuid, p jsonb)` | `uuid` | Upserts `ingredients` by `name_key` and replaces `dish_ingredients`, in one transaction |
| `fork_dish(p_id uuid)` | `uuid` | Copies the dish and its ingredients. Bumps `fork_count` through a definer helper. |
| `search_dishes(q text, p_meal meal_type, p_limit int)` | setof dishes | `pg_trgm` similarity over the user's own and public dishes. Also used by voice. |
| `copy_week(p_from date, p_to date, p_mode text)` | `int` slots | `merge` keeps existing slots; `replace` clears the target first |
| `autofill_week(p_week date)` | `int` | Fills empty slots from own and public dishes, respecting diet and exclusions |
| `shopping_list(p_from date, p_to date)` | table(item_key, ingredient_id, name, aisle, quantity, unit, checked, is_extra) | Converts kg→g and l→ml. Scales by `coalesce(slot.servings, household_size) / dish.servings`. Unions extras. |
| `budget_summary(p_month date)` | jsonb `{budget_paise, by_category, by_week[], remaining_paise}` | Month boundaries come from `user_settings.timezone` |
| `waste_patterns(p_since date)` | table(ingredient_name, count) | `having count(*) >= 2` |
| `get_shared_plan(p_slug text)` **definer**, anon | jsonb | Returns nothing if revoked. Exposes only dish name, image and tags, plus the owner's username. Bumps `view_count`. |
| `copy_shared_plan(p_slug text, p_to_week date)` **definer** | `int` | Reads the shared plan and writes slots for `auth.uid()` only. Bumps `copy_count`. |
| `publish_menu(p jsonb)` | `uuid` | Copies slots into `menu_items` from `from_week` (week), `from_week` + `day_index` (day) or 4 weeks (month). Checks that `day_index < day_count` and that every dish is readable (paid: owned). Sets `status='published', published_at=now()`. |
| `apply_menu(p_menu uuid, p_start date, p_mode text)` | `int` | Requires an acquisition. Maps `day_index` → (`week_start`, `day_index`) through `ensure_plan`. Sets `source_menu_id` and `last_applied_at`. |
| `creator_stats()` | jsonb | Per-menu acquisitions, rating and (4b) earnings for `auth.uid()` |
| `moderate_report(p_id uuid, p_action text, p_note text)` **definer** | void | Requires `private.is_admin()`. `remove_target` sets `menus.status='removed'`, `menu_ratings.hidden_at` or `dishes.visibility='private'`. |
| `delete_my_account()` **definer** | void | `delete from auth.users where id = auth.uid()`. Cascades all rows. Storage cleanup runs from the action. |

### 3.3 Server Actions

Zod building blocks live in `src/lib/validation/common.ts`, which already holds `uuid`, `isoDate` and `safeText`. Enums come from `Database["public"]["Enums"]`.

```ts
const rupees  = z.number().positive().max(100000).transform((r) => Math.round(r * 100)); // -> paise
const monday  = isoDate.refine((d) => new Date(d + "T00:00:00Z").getUTCDay() === 1, "must be a Monday");
const unit    = z.enum(["g","kg","ml","l","pcs","tsp","tbsp","cup","bunch","pinch","to_taste"]);
const ingredientIn = z.object({ name: safeText(80), quantity: z.number().positive().max(100000).optional(), unit: unit.optional(), note: z.string().max(80).optional() });
const dishIn = z.object({
  name: safeText(100), description: z.string().max(1000).optional(), steps: z.string().max(5000).optional(),
  mealTypes: z.array(mealType).max(4), dietType: dietType.optional(), tags: z.array(z.string().max(40)).max(20),
  servings: z.number().int().min(1).max(20), prepMinutes: z.number().int().min(0).max(600).optional(),
  imagePath: z.string().max(300).optional(), visibility: z.enum(["private","unlisted","public"]),
  ingredients: z.array(ingredientIn).min(1).max(50),
});
```

| Action | Input (zod) | Output | Implementation |
|---|---|---|---|
| **Auth** | | | |
| `signInWithGoogle` | `{ next?: z.string().regex(/^\/[^/]/) }` | `redirect(url)` | `auth.signInWithOAuth({ provider:'google', options:{ redirectTo: origin+'/auth/callback?next=' } })` |
| `signInWithEmail` | `{ email: z.string().email().max(254), next? }` | `{ sent: true }` | `auth.signInWithOtp({ email, options:{ emailRedirectTo } })` (rate-limited) |
| `signOut` | none | `redirect('/')` | `auth.signOut()` |
| **Profile** | | | |
| `completeOnboarding` | `{ username: /^[a-z0-9_]{3,20}$/, displayName: safeText(60), goal, dietType, householdSize: 1..12, monthlyBudget: rupees, eatoutPerWeek: 0..21, exclusions: string[]≤50, city?: safeText(60) }` | `{ ok }`, then redirect `/dashboard` | Updates `profiles` and `user_settings`, sets `onboarded_at`. Maps unique violation `23505` to the field error "username taken". |
| `checkUsername` | `{ username }` | `{ available: boolean }` | `select id from profiles where username = $1` |
| `updateProfile` | partial of `{ displayName, bio ≤280, city, avatarUrl }` | `{ profile }` | Avatar is uploaded from the browser to `avatars/{uid}/…`; the action stores the public URL |
| `updateSettings` | partial of the onboarding settings fields | `{ settings }` | |
| `deleteAccount` | `{ confirm: z.literal("DELETE") }` | `redirect('/')` | Removes Storage objects under `{uid}/`, then `rpc('delete_my_account')` |
| **Dishes** | | | |
| `createDish` | `dishIn` | `{ id }` | `rpc('create_dish')`, then `revalidatePath('/my-templates')` |
| `updateDish` | `dishIn.partial().extend({ id: uuid })` | `{ id }` | `rpc('update_dish')` |
| `archiveDish` | `{ id: uuid }` | `{ ok }` | `update dishes set archived_at = now()` |
| `forkDish` | `{ id: uuid }` | `{ id }` | `rpc('fork_dish')` |
| **Planner** | | | |
| `setSlot` | `{ weekStart: monday, dayIndex: 0..6, mealType, position: 0..9 = 0, kind: 'dish'\|'eatout'\|'skip', dishId?: uuid, servings?: 1..20, note?: ≤140 }` + refine(kind = dish ⇒ dishId) | `{ slot }` | `ensure_plan`, then upsert `onConflict: 'plan_id,day_index,meal_type,position'` |
| `moveSlot` | `{ slotId: uuid, toWeekStart: monday, toDayIndex, toMealType, toPosition }` | `{ slot }` | Swaps with the slot at the target position if one is there (RPC) |
| `clearSlot` | `{ slotId: uuid }` | `{ ok }` | delete |
| `copyWeek` | `{ from: monday, to: monday, mode: 'merge'\|'replace' }` | `{ count }` | `rpc('copy_week')` |
| `autofillWeek` | `{ weekStart: monday }` | `{ count }` | `rpc('autofill_week')` |
| `voiceAddToPlan` | `{ transcript: z.string().min(1).max(200), weekStart?, dayIndex?, mealType? }` | `{ query, matches: {id,name,tags}[] }` | Uses the existing allowlist sanitiser, then `rpc('search_dishes')`. The user confirms, and the UI calls `setSlot`. |
| **Shopping list** | | | Read: `rpc('shopping_list', {from,to})` in the page. Share text is built on the client (Web Share API, WhatsApp fallback). |
| `toggleShoppingItem` | `{ periodStart: isoDate, itemKey: z.string().max(80), checked: boolean }` | `{ ok }` | upsert or delete in `shopping_list_marks` |
| `addShoppingExtra` | `{ periodStart, name: safeText(80), quantity?, unit? }` | `{ extra }` | |
| `removeShoppingExtra` | `{ id: uuid }` | `{ ok }` | |
| **Budget and waste** | | | Read: `rpc('budget_summary')`, `rpc('waste_patterns')`, plus `expenses` for the month |
| `addExpense` | `{ amount: rupees, category: 'groceries'\|'eatout'\|'other', note?: ≤140, spentOn: isoDate, slotId?: uuid }` | `{ expense }` | |
| `updateExpense` / `deleteExpense` | `{ id: uuid, …partial }` / `{ id }` | `{ expense }` / `{ ok }` | |
| `logWaste` | `{ ingredientName: safeText(80), ingredientId?: uuid, level: wasteLevel, loggedOn?: isoDate, slotId?: uuid }` | `{ entry }` | |
| **Sharing** | | | Public pages `/p/[slug]` and `/u/[username]` are server components using the anon client |
| `createPlanShare` | `{ weekStart: monday, visibility: 'unlisted'\|'public' }` | `{ slug, url }` | `ensure_plan`, then insert. On unique violation, return the active share. |
| `revokePlanShare` | `{ id: uuid }` | `{ ok }` | `update set revoked_at = now()` |
| `copySharedPlan` | `{ slug: z.string().regex(/^[A-Za-z0-9_-]{10,16}$/), toWeekStart: monday }` | `{ count }` | `rpc('copy_shared_plan')` |
| **Marketplace** | | | Read: `/market?period&diet&goal&maxPrice&minRating&sort=top\|new\|popular&cursor` is a server component. It uses the partial indexes and keyset pagination on `(sort_key, id)`. |
| `publishMenu` | `{ source: { weekStart: monday, dayIndex?: 0..6 }, period: 'day'\|'week'\|'month', title: safeText(80), description?: ≤2000, tags: ≤10, dietType?, goal?, coverPath?, price: z.literal(0) }` (4b: `rupees` 19–199) | `{ menuId }` | `rpc('publish_menu')` |
| `updateMenu` | `{ id, title?, description?, tags?, coverPath?, status?: 'draft'\|'published' }` | `{ menu }` | Unpublishing returns the menu to draft |
| `getMenu` | `{ menuId: uuid }` | `{ ok }` | Inserts a free acquisition (RLS enforces free, published, not the creator) |
| `applyMenu` | `{ menuId: uuid, startDate: isoDate, mode: 'merge'\|'replace' }` | `{ count }` | `rpc('apply_menu')` |
| `rateMenu` | `{ menuId: uuid, stars: 1..5, review?: ≤1000 }` | `{ rating }` | Upsert. An FK violation means "get the menu first". |
| `deleteRating` | `{ menuId: uuid }` | `{ ok }` | |
| `report` | `{ targetType, targetId: uuid, reason, details?: ≤1000 }` | `{ ok }` | Rate-limited. A unique violation counts as "already reported". |
| `moderateReport` (admin) | `{ id: uuid, action: 'dismiss'\|'remove_target', note?: ≤500 }` | `{ ok }` | `rpc('moderate_report')` |
| `createRazorpayOrder` *(4b)* | `{ menuId: uuid }` | `{ orderId, amountPaise, keyId }` | Uses the service-role client. Inserts a `payments(status='created')` row. The client opens Checkout, and the webhook confirms the payment. |

---

## 4. Delete or rewrite in the current code

**Delete (Swiggy, BACKLOG T1.1):**
- `src/app/cart/`, `src/components/cart/cart-view.tsx`
- `src/app/api/cart/build/route.ts`, `src/app/api/cart/add-to-instamart/route.ts`
- `src/lib/swiggy-mcp.ts`
- The `SWIGGY_*` vars in `.env.example`. Move `docs/SWIGGY_MCP_INTEGRATION.md` to `docs/later/`.
- Schema leftovers: `orders_log`, the `order_source` enum, `template_ingredients.instamart_search_hint`, and `templates.is_paid`, `price` and `buy_count`. Pricing moves to `menus`.
- Swiggy and Instamart copy and CTAs in:
  - `app/page.tsx`, `app/layout.tsx` (metadata)
  - `app/dashboard/page.tsx`, `app/budget/page.tsx`
  - `components/dashboard/{meal-cards,stats-card}.tsx`, `components/meal-plan/meal-plan-board.tsx`
  - `components/onboarding/onboarding-flow.tsx`
  - `components/templates/{detail/template-detail,new/template-form}.tsx`

**Delete (auth and DB swap):**
- Clerk: `@clerk/nextjs`, `svix`, `src/app/api/auth/webhook/route.ts`, `<ClerkProvider>` in `layout.tsx`, `src/components/auth/mock-sign-{in,up}-form.tsx`
- Neon and Drizzle: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`, `src/db/index.ts`, `src/db/schema.ts`, `drizzle.config.ts`, and the `db:*` scripts
- `src/lib/current-user.ts`. It writes on read (a lazy insert in GET paths) and two concurrent first requests race on the `clerk_id` unique constraint. The signup trigger and `requireUser()` replace it.

**Delete (mock coupling):**
- `src/lib/mock.ts`. It turns mock mode on when the Clerk key is missing, so auth config and data source are coupled.
- `src/components/templates/mock-templates.ts`, `src/components/templates/detail/mock-details.ts`, `src/components/my-templates/mock-mine.ts`
- The `isMockMode()` branches in `middleware.ts`, `layout.tsx`, `dashboard/page.tsx`, `meal-plan/page.tsx`, `budget/page.tsx`, `my-templates/page.tsx`, settings, onboarding and the template pages.
- `my-templates/page.tsx` shows the problem: `mock ? getMineTemplates() : getMineTemplates()` returns mock data in both modes.
- Replacements:
  - The `platecart-dev` project plus `supabase/seed.sql`. The agent can provision it, so a no-keys mode is no longer needed.
  - Fixtures under `tests/fixtures/` for unit tests.
  - If an offline demo is still wanted, run `supabase start` (local Docker stack with the same migrations and seed). Never add per-page `isMockMode()` branches again.
- This changes the BACKLOG ground rule "mock mode still boots" to "the dev project and seed boot".

**Rewrite:**

| Current | Target |
|---|---|
| `src/middleware.ts` | `updateSession` + route protection + CSP update (§1 step 4) |
| `src/app/api/budget/summary` (reads `orders_log` instamart/food, UTC month) | `rpc('budget_summary')` over `expenses`, using the user's timezone |
| `src/app/api/meal-plans/current` | `ensure_plan(monday)` in the page. **Bug:** it uses `gte(week_start)` with no `order by`, so it can return next week's plan. |
| `src/app/api/meal-plans/[id]/slots` | `setSlot` action. **Bug:** with no unique `(plan, day, meal)` constraint, the find-then-insert races into duplicate slots. |
| `src/app/api/templates` POST, `templates/[id]/fork` | `create_dish` / `fork_dish` RPCs. **Bug:** dish and ingredients are inserted without a transaction (`neon-http` has none), so a failure leaves orphan templates. |
| `src/app/api/templates/[id]` GET | Server component read. Today it requires auth, which blocks public share and profile pages. RLS with an `anon` read fixes that. |
| `src/app/api/templates` GET | Server component with the trigram search plus tag filter. Keep its cursor pagination idea, keyed on `(created_at, id)` to avoid ties. |
| `src/app/api/voice/parse` | `voiceAddToPlan` action. Keep the allowlist sanitiser and remove the mock branch. |
| `src/app/api/user/profile`, `waste/*` | `updateProfile` / `updateSettings` / `logWaste` actions and `waste_patterns` RPC |
| `src/lib/validation/common.ts` | Keep. Add `monday`, `rupees` and `unit`. Derive enums from the generated DB types so zod and Postgres can't drift. |
| `src/lib/rate-limit.ts` | Keep for now (TX.1 later) |
| Route handler `params: Promise<…>` typing | This is Next 15 style on Next 14. It works, but it goes away with the routes. |
| `.env.example` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and (4b) `SUPABASE_SECRET_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |

Suggested order:
1. T1.1 Swiggy removal. It needs no keys.
2. Provision Supabase and apply the §2 migrations. Then advisors, types and seed.
3. Auth swap (§1 steps 3–7).
4. Pages: onboarding → meal plan → shopping list → budget → dishes → sharing → market.
