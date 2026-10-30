-- Move internal helpers out of the exposed API schema so they can't be called via /rest/v1/rpc.
-- Policies, triggers and column defaults reference functions by OID, so they keep working.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

alter function public.touch_updated_at() set schema private;
alter function public.random_slug(int) set schema private;
alter function public.is_admin() set schema private;
alter function public.handle_new_user() set schema private;
alter function public.dish_visible(uuid) set schema private;
alter function public.menu_visible(uuid) set schema private;
alter function public.refresh_menu_rating() set schema private;

revoke execute on all functions in schema private from public, anon, authenticated;
-- RLS policies evaluate these as the calling role.
grant execute on function private.dish_visible(uuid), private.menu_visible(uuid) to anon, authenticated;
grant execute on function private.is_admin() to authenticated;

-- Function bodies reference helpers by name, so recreate the one that used public.is_admin().
create or replace function public.admin_set_status(p_type public.report_target, p_id uuid, p_status public.content_status) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_type = 'menu' then update public.menus set status = p_status where id = p_id;
  elsif p_type = 'rating' then update public.menu_ratings set status = p_status where id = p_id;
  else update public.dishes set status = p_status where id = p_id;
  end if;
  update public.reports set resolved = true where target_type = p_type and target_id = p_id;
end $$;
revoke execute on function public.admin_set_status(public.report_target, uuid, public.content_status) from public, anon;
