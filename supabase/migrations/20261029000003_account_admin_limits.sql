-- Account self-service, admin queue, and per-user write caps (cheap abuse ceiling without Redis).

create or replace function public.am_i_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin()
$$;

-- DPDP right to erasure: deleting the auth user cascades to every row the user owns.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  delete from auth.users where id = uid;
end $$;

-- Admin queue: open reports with a readable label for the reported content.
create or replace function public.admin_reports() returns table (
  id uuid, target_type public.report_target, target_id uuid, reason text, created_at timestamptz,
  label text, target_status public.content_status, report_count bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select r.id, r.target_type, r.target_id, r.reason, r.created_at,
    case r.target_type
      when 'menu' then (select m.title || ' (/m/' || m.slug || ')' from public.menus m where m.id = r.target_id)
      when 'rating' then (select left(coalesce(mr.review, mr.stars || ' stars'), 120) from public.menu_ratings mr where mr.id = r.target_id)
      else (select d.name from public.dishes d where d.id = r.target_id)
    end,
    case r.target_type
      when 'menu' then (select m.status from public.menus m where m.id = r.target_id)
      when 'rating' then (select mr.status from public.menu_ratings mr where mr.id = r.target_id)
      else (select d.status from public.dishes d where d.id = r.target_id)
    end,
    count(*) over (partition by r.target_type, r.target_id)
  from public.reports r
  where not r.resolved
  order by r.created_at desc
  limit 200;
end $$;

-- Per-user daily write caps. Raised as a friendly error the UI shows as-is.
create or replace function private.enforce_daily_cap() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  cap int := tg_argv[1]::int;
  owner_col text := tg_argv[0];
  uid uuid;
  n int;
begin
  uid := (to_jsonb(new) ->> owner_col)::uuid;
  if uid is null then return new; end if;
  execute format('select count(*) from %I.%I where %I = $1 and created_at > now() - interval ''1 day''',
                 tg_table_schema, tg_table_name, owner_col)
    into n using uid;
  if n >= cap then
    raise exception 'Daily limit reached (% per day). Please try again tomorrow.', cap using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger dishes_daily_cap before insert on public.dishes
  for each row execute function private.enforce_daily_cap('owner_id', '200');
create trigger menus_daily_cap before insert on public.menus
  for each row execute function private.enforce_daily_cap('owner_id', '20');
create trigger ratings_daily_cap before insert on public.menu_ratings
  for each row execute function private.enforce_daily_cap('user_id', '30');
create trigger reports_daily_cap before insert on public.reports
  for each row execute function private.enforce_daily_cap('reporter_id', '20');

revoke execute on function private.enforce_daily_cap() from public, anon, authenticated;
revoke execute on function public.am_i_admin(), public.delete_my_account(), public.admin_reports() from public, anon;
grant execute on function public.am_i_admin(), public.delete_my_account(), public.admin_reports() to authenticated;
