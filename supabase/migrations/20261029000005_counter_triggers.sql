-- Keep get_count / fork_count exact when acquisitions or copies are deleted (e.g. account deletion cascades).
create or replace function private.refresh_menu_get_count() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  mid uuid := coalesce(new.menu_id, old.menu_id);
begin
  update public.menus m
  set get_count = (select count(*) from public.menu_acquisitions a where a.menu_id = mid and a.user_id is distinct from m.owner_id)
  where m.id = mid;
  return null;
end $$;

create trigger menu_acquisitions_count after insert or delete on public.menu_acquisitions
  for each row execute function private.refresh_menu_get_count();

create or replace function private.refresh_dish_fork_count() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  src uuid := coalesce(new.forked_from, old.forked_from);
begin
  if src is not null then
    update public.dishes set fork_count = (select count(distinct f.owner_id) from public.dishes f where f.forked_from = src) where id = src;
  end if;
  return null;
end $$;

create trigger dishes_fork_count after insert or delete on public.dishes
  for each row execute function private.refresh_dish_fork_count();

revoke execute on function private.refresh_menu_get_count(), private.refresh_dish_fork_count() from public, anon, authenticated;

-- Repair any drift.
update public.menus m set get_count = (select count(*) from public.menu_acquisitions a where a.menu_id = m.id and a.user_id is distinct from m.owner_id);
update public.dishes d set fork_count = (select count(distinct f.owner_id) from public.dishes f where f.forked_from = d.id);
