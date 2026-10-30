-- End-to-end check of the app's real API calls (PostgREST + Auth over HTTPS) as a signed-in user.
-- Run each of the 3 blocks separately (the user must be committed before Auth can see it).

-- 1) Setup: enable http and create a confirmed test user (no email is sent).
create extension if not exists http with schema extensions;
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'e2e-tester@planetto.test',
  extensions.crypt('E2e-Test-Pass-2026!', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"E2E Tester"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (gen_random_uuid(), 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","email":"e2e-tester@planetto.test","email_verified":true}', 'email', now(), now(), now())
on conflict do nothing;

-- 2) Run: replace <PROJECT> and <PUBLISHABLE_KEY>, then run this block. Every status should be 2xx
--    except "admin_reports as non-admin" (403).
create or replace function pg_temp.call(method text, path text, token text, body text default null, prefer text default null)
returns table(status int, content text) language sql as $$
  select (r).status, (r).content from (select extensions.http((
    method, 'https://<PROJECT>.supabase.co' || path,
    array[extensions.http_header('apikey','<PUBLISHABLE_KEY>')]
      || case when token is not null then array[extensions.http_header('Authorization','Bearer ' || token)] else array[]::extensions.http_header[] end
      || case when prefer is not null then array[extensions.http_header('Prefer', prefer)] else array[]::extensions.http_header[] end,
    'application/json', body)::extensions.http_request) r) x
$$;
create temp table out (step text, status int, body text);
do $$
declare
  tok text; uid text := 'aaaaaaaa-0000-4000-8000-000000000001'; r record; dish text; slug text; menu_id text; mslug text;
begin
  select (content::jsonb ->> 'access_token') into tok from pg_temp.call('POST','/auth/v1/token?grant_type=password', null,
    '{"email":"e2e-tester@planetto.test","password":"E2e-Test-Pass-2026!"}');
  select * into r from pg_temp.call('PATCH', '/rest/v1/profiles?id=eq.' || uid, tok, '{"username":"e2e_tester"}', 'return=minimal');
  insert into out values ('onboard username', r.status, left(r.content,150));
  select * into r from pg_temp.call('PATCH', '/rest/v1/user_settings?user_id=eq.' || uid, tok, '{"diet":"veg","exclusions":["onion"],"household_size":3,"onboarded":true}', 'return=minimal');
  insert into out values ('onboard settings', r.status, left(r.content,150));
  select * into r from pg_temp.call('GET', '/rest/v1/dishes?select=id,name,diet,meal_types,owner_id&or=(owner_id.eq.' || uid || ',and(owner_id.is.null,is_public.eq.true))&status=eq.active&order=name&limit=500', tok);
  insert into out values ('picker dishes', r.status, left(r.content, 80));
  dish := (r.content::jsonb -> 0 ->> 'id');
  select * into r from pg_temp.call('POST', '/rest/v1/plan_slots?on_conflict=user_id,date,meal', tok,
    json_build_object('user_id',uid,'date','2026-11-02','meal','lunch','dish_id',dish,'is_eatout',false,'note',null)::text, 'resolution=merge-duplicates,return=minimal');
  insert into out values ('upsert slot', r.status, left(r.content,150));
  select * into r from pg_temp.call('POST', '/rest/v1/plan_slots?on_conflict=user_id,date,meal', tok,
    json_build_object('user_id',uid,'date','2026-11-02','meal','dinner','dish_id',null,'is_eatout',true)::text, 'resolution=merge-duplicates,return=minimal');
  insert into out values ('eatout slot', r.status, left(r.content,150));
  select * into r from pg_temp.call('GET', '/rest/v1/plan_slots?select=date,meal,is_eatout,dish:dishes(id,name,diet,cook_minutes)&user_id=eq.' || uid || '&date=gte.2026-11-02&date=lte.2026-11-08', tok);
  insert into out values ('read plan', r.status, left(r.content,200));
  select * into r from pg_temp.call('POST', '/rest/v1/rpc/save_dish', tok,
    '{"p_id":null,"p_dish":{"name":"E2E Amma Sambar","description":"","diet":"veg","meal_types":["lunch"],"cook_minutes":30,"steps":"Boil dal","tags":["test"],"is_public":true},"p_ingredients":[{"name":"toor dal","quantity":1,"unit":"cup"}]}');
  insert into out values ('save_dish', r.status, left(r.content,150));
  select * into r from pg_temp.call('GET', '/rest/v1/dishes?select=id,name,owner:profiles!dishes_owner_id_fkey(display_name,username),dish_ingredients(name,quantity,unit,position)&id=eq.' || trim(both '"' from r.content), tok);
  insert into out values ('dish detail', r.status, left(r.content,250));
  select * into r from pg_temp.call('POST', '/rest/v1/rpc/create_menu_from_plan', tok,
    '{"p_start":"2026-11-02","p_period":"day","p_title":"E2E test day","p_description":"","p_visibility":"link","p_diet":"veg","p_tags":["test"]}');
  insert into out values ('create menu', r.status, r.content);
  slug := trim(both '"' from r.content);
  select * into r from pg_temp.call('POST', '/rest/v1/rpc/menu_by_slug', null, json_build_object('p_slug', slug)::text);
  insert into out values ('anon menu_by_slug', r.status, left(r.content,200));
  select * into r from pg_temp.call('GET', '/rest/v1/menus?select=id,slug,title,owner:profiles!menus_owner_id_fkey(display_name)&visibility=eq.public&status=eq.active&period=eq.day&order=rating_avg.desc', null);
  insert into out values ('anon market day', r.status, left(r.content,200));
  mslug := r.content::jsonb -> 0 ->> 'slug'; menu_id := r.content::jsonb -> 0 ->> 'id';
  select * into r from pg_temp.call('POST', '/rest/v1/rpc/get_menu', tok, json_build_object('p_slug', mslug, 'p_start', '2026-11-03', 'p_mode', 'fill_empty')::text);
  insert into out values ('get_menu', r.status, r.content);
  select * into r from pg_temp.call('POST', '/rest/v1/menu_ratings', tok, json_build_object('menu_id', menu_id, 'user_id', uid, 'stars', 5, 'review', 'E2E great')::text, 'return=minimal');
  insert into out values ('rate', r.status, left(r.content,150));
  select * into r from pg_temp.call('GET', '/rest/v1/menu_acquisitions?select=start_date,menu:menus(slug,title,owner:profiles!menus_owner_id_fkey(display_name))&user_id=eq.' || uid, tok);
  insert into out values ('my used menus', r.status, left(r.content,200));
  select * into r from pg_temp.call('POST', '/rest/v1/rpc/admin_reports', tok, '{}');
  insert into out values ('admin_reports as non-admin', r.status, left(r.content,120));
end $$;
select * from out;

-- 3) Cleanup: deleting the user cascades to everything it created; triggers fix the counters.
delete from auth.users where id = 'aaaaaaaa-0000-4000-8000-000000000001';
drop extension if exists http;
