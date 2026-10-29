-- Planetto v1 schema. Every table has RLS on; identity is auth.uid().
-- Aggregates (fork/get/rating counts) are written only by security-definer functions.

create extension if not exists pgcrypto with schema extensions;

/* ---------- Enums ---------- */
create type public.diet_type as enum ('veg', 'egg', 'nonveg', 'vegan', 'jain');
create type public.meal_type as enum ('breakfast', 'lunch', 'dinner');
create type public.menu_period as enum ('day', 'week', 'month');
create type public.menu_visibility as enum ('private', 'link', 'public');
create type public.content_status as enum ('active', 'hidden');
create type public.report_target as enum ('menu', 'rating', 'dish');

/* ---------- Helpers ---------- */
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function public.random_slug(len int default 10) returns text
language sql volatile set search_path = '' as $$
  select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789', (floor(random() * 31) + 1)::int, 1), '')
  from generate_series(1, len)
$$;

/* ---------- Profiles (public) + settings (private) ---------- */
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default 'Planetto cook' check (char_length(display_name) between 1 and 60),
  bio text check (char_length(bio) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  diet public.diet_type,
  exclusions text[] not null default '{}' check (cardinality(exclusions) <= 30),
  household_size int not null default 2 check (household_size between 1 and 12),
  onboarded boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Staff list. No client policies: only readable through is_admin().
create table public.admins (
  user_id uuid primary key references public.profiles (id) on delete cascade
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
$$;

-- New auth user -> profile + settings. Display name never falls back to the email.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  dn text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    'Planetto cook #' || substr(replace(new.id::text, '-', ''), 1, 4)
  );
begin
  insert into public.profiles (id, display_name) values (new.id, left(dn, 60));
  insert into public.user_settings (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

/* ---------- Dishes ---------- */
create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete cascade, -- null = Planetto Kitchen library
  name text not null check (char_length(name) between 2 and 80),
  description text check (char_length(description) <= 500),
  meal_types public.meal_type[] not null default '{}',
  diet public.diet_type not null default 'veg',
  tags text[] not null default '{}' check (cardinality(tags) <= 6),
  cook_minutes int check (cook_minutes between 1 and 600),
  steps text check (char_length(steps) <= 4000),
  is_public boolean not null default false,
  status public.content_status not null default 'active',
  forked_from uuid references public.dishes (id) on delete set null,
  fork_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dishes_owner_idx on public.dishes (owner_id);
create index dishes_public_idx on public.dishes (is_public, status) where is_public;
create index dishes_forked_from_idx on public.dishes (forked_from);

create table public.dish_ingredients (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes (id) on delete cascade,
  position int not null default 0,
  name text not null check (char_length(name) between 1 and 60),
  quantity numeric check (quantity > 0 and quantity < 100000),
  unit text check (char_length(unit) <= 20)
);
create index dish_ingredients_dish_idx on public.dish_ingredients (dish_id);

create or replace function public.dish_visible(p_dish uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.dishes d
    where d.id = p_dish
      and ((d.is_public and d.status = 'active') or d.owner_id = (select auth.uid()))
  )
$$;

/* ---------- Plan (one row per user/date/meal) ---------- */
create table public.plan_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  meal public.meal_type not null,
  dish_id uuid references public.dishes (id) on delete set null,
  is_eatout boolean not null default false,
  note text check (char_length(note) <= 120),
  updated_at timestamptz not null default now(),
  unique (user_id, date, meal)
);
create index plan_slots_dish_idx on public.plan_slots (dish_id);

/* ---------- Menus (share + marketplace are the same object) ---------- */
create table public.menus (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete cascade, -- null = Planetto Kitchen
  slug text not null unique default public.random_slug(10),
  title text not null check (char_length(title) between 3 and 80),
  description text check (char_length(description) <= 600),
  period public.menu_period not null,
  days int not null check (days between 1 and 28),
  visibility public.menu_visibility not null default 'link',
  diet public.diet_type not null default 'veg',
  tags text[] not null default '{}' check (cardinality(tags) <= 3),
  status public.content_status not null default 'active',
  rating_avg numeric(3, 2) not null default 0,
  rating_count int not null default 0,
  get_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index menus_owner_idx on public.menus (owner_id);
create index menus_market_idx on public.menus (period, rating_avg desc) where visibility = 'public' and status = 'active';

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus (id) on delete cascade,
  day_index int not null check (day_index between 0 and 27),
  meal public.meal_type not null,
  is_eatout boolean not null default false,
  -- Snapshot so later edits or deletes of the source dish never change a published menu.
  dish_name text check (char_length(dish_name) <= 80),
  dish_diet public.diet_type,
  ingredients jsonb not null default '[]',
  source_dish_id uuid references public.dishes (id) on delete set null,
  unique (menu_id, day_index, meal)
);
create index menu_items_source_idx on public.menu_items (source_dish_id);

create table public.menu_acquisitions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  menu_id uuid not null references public.menus (id) on delete cascade,
  start_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, menu_id)
);
create index menu_acquisitions_menu_idx on public.menu_acquisitions (menu_id);

create table public.menu_ratings (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  review text check (char_length(review) <= 500),
  status public.content_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (menu_id, user_id)
);
create index menu_ratings_user_idx on public.menu_ratings (user_id);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason text not null check (char_length(reason) between 3 and 500),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index reports_reporter_idx on public.reports (reporter_id);

create or replace function public.menu_visible(p_menu uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.menus m
    where m.id = p_menu
      and ((m.visibility = 'public' and m.status = 'active') or m.owner_id = (select auth.uid()))
  )
$$;

/* ---------- updated_at triggers ---------- */
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.user_settings for each row execute function public.touch_updated_at();
create trigger dishes_touch before update on public.dishes for each row execute function public.touch_updated_at();
create trigger plan_touch before update on public.plan_slots for each row execute function public.touch_updated_at();
create trigger menus_touch before update on public.menus for each row execute function public.touch_updated_at();
create trigger ratings_touch before update on public.menu_ratings for each row execute function public.touch_updated_at();

/* ---------- Rating aggregates ---------- */
create or replace function public.refresh_menu_rating() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  mid uuid := coalesce(new.menu_id, old.menu_id);
begin
  update public.menus m set
    rating_count = s.n,
    rating_avg = coalesce(s.avg, 0)
  from (
    select count(*)::int as n, round(avg(stars)::numeric, 2) as avg
    from public.menu_ratings r where r.menu_id = mid and r.status = 'active'
  ) s
  where m.id = mid;
  return null;
end $$;

create trigger menu_ratings_refresh after insert or update or delete on public.menu_ratings
  for each row execute function public.refresh_menu_rating();

/* ---------- RLS ---------- */
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.admins enable row level security;
alter table public.dishes enable row level security;
alter table public.dish_ingredients enable row level security;
alter table public.plan_slots enable row level security;
alter table public.menus enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_acquisitions enable row level security;
alter table public.menu_ratings enable row level security;
alter table public.reports enable row level security;

-- profiles: public read of the public card; owner edits name/username/bio.
create policy profiles_read on public.profiles for select to anon, authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- user_settings: owner only.
create policy settings_own on public.user_settings for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- dishes
create policy dishes_read on public.dishes for select to anon, authenticated
  using ((is_public and status = 'active') or owner_id = (select auth.uid()));
create policy dishes_insert on public.dishes for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'active' and fork_count = 0);
create policy dishes_update on public.dishes for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy dishes_delete on public.dishes for delete to authenticated
  using (owner_id = (select auth.uid()));

-- dish_ingredients follow their dish
create policy ingredients_read on public.dish_ingredients for select to anon, authenticated
  using (public.dish_visible(dish_id));
create policy ingredients_write on public.dish_ingredients for all to authenticated
  using (exists (select 1 from public.dishes d where d.id = dish_id and d.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.dishes d where d.id = dish_id and d.owner_id = (select auth.uid())));

-- plan_slots: owner only, and the dish must be visible to the owner (no IDOR on private dishes).
create policy plan_own_read on public.plan_slots for select to authenticated
  using (user_id = (select auth.uid()));
create policy plan_own_insert on public.plan_slots for insert to authenticated
  with check (user_id = (select auth.uid()) and (dish_id is null or public.dish_visible(dish_id)));
create policy plan_own_update on public.plan_slots for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (dish_id is null or public.dish_visible(dish_id)));
create policy plan_own_delete on public.plan_slots for delete to authenticated
  using (user_id = (select auth.uid()));

-- menus: public listings + own. Link-only menus are read through menu_by_slug().
create policy menus_read on public.menus for select to anon, authenticated
  using ((visibility = 'public' and status = 'active') or owner_id = (select auth.uid()));
create policy menus_insert on public.menus for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'active' and rating_count = 0 and get_count = 0);
create policy menus_update on public.menus for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy menus_delete on public.menus for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy menu_items_read on public.menu_items for select to anon, authenticated
  using (public.menu_visible(menu_id));
create policy menu_items_write on public.menu_items for all to authenticated
  using (exists (select 1 from public.menus m where m.id = menu_id and m.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.menus m where m.id = menu_id and m.owner_id = (select auth.uid())));

-- acquisitions: owner reads; writes only through get_menu().
create policy acquisitions_read on public.menu_acquisitions for select to authenticated
  using (user_id = (select auth.uid()));

-- ratings: visible ones on visible menus are public; only people who got the menu (not its owner) can rate.
create policy ratings_read on public.menu_ratings for select to anon, authenticated
  using ((status = 'active' and public.menu_visible(menu_id)) or user_id = (select auth.uid()));
create policy ratings_insert on public.menu_ratings for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'active'
    and exists (select 1 from public.menu_acquisitions a where a.menu_id = menu_ratings.menu_id and a.user_id = (select auth.uid()))
    and not exists (select 1 from public.menus m where m.id = menu_ratings.menu_id and m.owner_id = (select auth.uid()))
  );
create policy ratings_update on public.menu_ratings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy ratings_delete on public.menu_ratings for delete to authenticated
  using (user_id = (select auth.uid()));

-- reports: reporter inserts and reads own; admins read all through admin RPCs.
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and resolved = false);
create policy reports_read on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or public.is_admin());

/* ---------- RPCs ---------- */

-- Read a menu by its share slug (link or public), with items. Never exposes private menus of others.
create or replace function public.menu_by_slug(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'menu', to_jsonb(m) - 'owner_id',
    'owner', case when m.owner_id is null then jsonb_build_object('display_name', 'Planetto Kitchen', 'username', null)
             else (select jsonb_build_object('display_name', p.display_name, 'username', p.username) from public.profiles p where p.id = m.owner_id) end,
    'is_owner', m.owner_id = (select auth.uid()),
    'items', coalesce((select jsonb_agg(to_jsonb(i) - 'menu_id' - 'source_dish_id' order by i.day_index, i.meal)
                       from public.menu_items i where i.menu_id = m.id), '[]'::jsonb)
  )
  from public.menus m
  where m.slug = p_slug
    and m.status = 'active'
    and (m.visibility in ('link', 'public') or m.owner_id = (select auth.uid()))
$$;

-- Snapshot the caller's plan into a new menu. Returns the slug.
create or replace function public.create_menu_from_plan(
  p_start date, p_period public.menu_period, p_title text, p_description text,
  p_visibility public.menu_visibility, p_diet public.diet_type, p_tags text[]
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  n_days int := case p_period when 'day' then 1 when 'week' then 7 else 28 end;
  new_id uuid;
  new_slug text;
  filled int;
begin
  if uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;

  select count(*) into filled from public.plan_slots s
  where s.user_id = uid and s.date between p_start and p_start + (n_days - 1)
    and (s.dish_id is not null or s.is_eatout);
  if filled = 0 then raise exception 'that range of your plan is empty' using errcode = '22023'; end if;

  insert into public.menus (owner_id, title, description, period, days, visibility, diet, tags)
  values (uid, p_title, nullif(trim(p_description), ''), p_period, n_days, p_visibility, p_diet, coalesce(p_tags, '{}'))
  returning id, slug into new_id, new_slug;

  insert into public.menu_items (menu_id, day_index, meal, is_eatout, dish_name, dish_diet, ingredients, source_dish_id)
  select new_id, (s.date - p_start), s.meal, s.is_eatout, d.name, d.diet,
         coalesce((select jsonb_agg(jsonb_build_object('name', gi.name, 'quantity', gi.quantity, 'unit', gi.unit) order by gi.position)
                   from public.dish_ingredients gi where gi.dish_id = d.id), '[]'::jsonb),
         d.id
  from public.plan_slots s
  left join public.dishes d on d.id = s.dish_id
  where s.user_id = uid and s.date between p_start and p_start + (n_days - 1)
    and (s.dish_id is not null or s.is_eatout);

  return new_slug;
end $$;

-- Apply a menu to the caller's calendar from p_start. mode: 'overwrite' | 'fill_empty'.
create or replace function public.get_menu(p_slug text, p_start date, p_mode text default 'fill_empty') returns int
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  m public.menus;
  it record;
  target_dish uuid;
  applied int := 0;
begin
  if uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if p_mode not in ('overwrite', 'fill_empty') then raise exception 'bad mode' using errcode = '22023'; end if;

  select * into m from public.menus
  where slug = p_slug and status = 'active' and (visibility in ('link', 'public') or owner_id = uid);
  if not found then raise exception 'menu not found' using errcode = 'P0002'; end if;

  for it in select * from public.menu_items where menu_id = m.id order by day_index, meal loop
    if p_mode = 'fill_empty' and exists (
      select 1 from public.plan_slots s where s.user_id = uid and s.date = p_start + it.day_index and s.meal = it.meal
        and (s.dish_id is not null or s.is_eatout)
    ) then
      continue;
    end if;

    target_dish := null;
    if not it.is_eatout and it.dish_name is not null then
      -- Reuse a dish the user already owns with the same name, else snapshot a private copy.
      select d.id into target_dish from public.dishes d
      where d.owner_id = uid and lower(d.name) = lower(it.dish_name) limit 1;
      if target_dish is null then
        insert into public.dishes (owner_id, name, diet, meal_types, is_public, forked_from)
        values (uid, it.dish_name, coalesce(it.dish_diet, m.diet), array[it.meal], false,
                (select d2.id from public.dishes d2 where d2.id = it.source_dish_id and d2.is_public))
        returning id into target_dish;
        insert into public.dish_ingredients (dish_id, position, name, quantity, unit)
        select target_dish, (e.ord - 1)::int, left(e.val ->> 'name', 60), nullif(e.val ->> 'quantity', '')::numeric, left(e.val ->> 'unit', 20)
        from jsonb_array_elements(it.ingredients) with ordinality as e(val, ord)
        where coalesce(e.val ->> 'name', '') <> '';
      end if;
    end if;

    insert into public.plan_slots (user_id, date, meal, dish_id, is_eatout)
    values (uid, p_start + it.day_index, it.meal, target_dish, it.is_eatout)
    on conflict (user_id, date, meal) do update set dish_id = excluded.dish_id, is_eatout = excluded.is_eatout, note = null;
    applied := applied + 1;
  end loop;

  insert into public.menu_acquisitions (user_id, menu_id, start_date) values (uid, m.id, p_start)
  on conflict (user_id, menu_id) do update set start_date = excluded.start_date;
  if found and m.owner_id is distinct from uid then
    update public.menus set get_count = (select count(*) from public.menu_acquisitions a where a.menu_id = m.id) where id = m.id;
  end if;

  return applied;
end $$;

-- Copy a visible public dish into the caller's library. Fork count = distinct forkers.
create or replace function public.fork_dish(p_dish uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  src public.dishes;
  new_id uuid;
begin
  if uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select * into src from public.dishes where id = p_dish and is_public and status = 'active';
  if not found then raise exception 'dish not found' using errcode = 'P0002'; end if;

  select id into new_id from public.dishes where owner_id = uid and forked_from = p_dish limit 1;
  if new_id is not null then return new_id; end if;

  insert into public.dishes (owner_id, name, description, meal_types, diet, tags, cook_minutes, steps, is_public, forked_from)
  values (uid, src.name, src.description, src.meal_types, src.diet, src.tags, src.cook_minutes, src.steps, false, src.id)
  returning id into new_id;
  insert into public.dish_ingredients (dish_id, position, name, quantity, unit)
  select new_id, position, name, quantity, unit from public.dish_ingredients where dish_id = src.id;

  update public.dishes set fork_count = (select count(distinct owner_id) from public.dishes f where f.forked_from = src.id)
  where id = src.id;
  return new_id;
end $$;

-- Admin moderation.
create or replace function public.admin_set_status(p_type public.report_target, p_id uuid, p_status public.content_status) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_type = 'menu' then update public.menus set status = p_status where id = p_id;
  elsif p_type = 'rating' then update public.menu_ratings set status = p_status where id = p_id;
  else update public.dishes set status = p_status where id = p_id;
  end if;
  update public.reports set resolved = true where target_type = p_type and target_id = p_id;
end $$;

/* ---------- Function grants: nothing runs as anon unless meant to ---------- */
revoke execute on all functions in schema public from public, anon;
grant execute on function public.menu_by_slug(text) to anon, authenticated;
grant execute on function public.dish_visible(uuid), public.menu_visible(uuid) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function
  public.create_menu_from_plan(date, public.menu_period, text, text, public.menu_visibility, public.diet_type, text[]),
  public.get_menu(text, date, text),
  public.fork_dish(uuid),
  public.admin_set_status(public.report_target, uuid, public.content_status)
to authenticated;

/* ---------- Column-level write grants ----------
 * Column REVOKEs are ignored while a table-level grant exists, so revoke the table
 * privilege and grant back only the columns clients may change. Counters, status,
 * owner and slug are then writable only by the security-definer functions above.
 */
revoke insert, update, delete on all tables in schema public from anon;
revoke update on public.profiles, public.user_settings, public.dishes, public.menus, public.menu_ratings from authenticated;
grant update (username, display_name, bio) on public.profiles to authenticated;
grant update (diet, exclusions, household_size, onboarded) on public.user_settings to authenticated;
grant update (name, description, meal_types, diet, tags, cook_minutes, steps, is_public) on public.dishes to authenticated;
grant update (title, description, visibility, diet, tags) on public.menus to authenticated;
grant update (stars, review) on public.menu_ratings to authenticated;
-- Menus and their items are created only through create_menu_from_plan(); acquisitions only through get_menu().
revoke insert on public.menus, public.menu_items, public.menu_acquisitions, public.profiles, public.user_settings, public.admins from authenticated;
revoke all on public.admins from authenticated;
