-- Profile photos (Google picture or uploaded) and planning preferences.

alter table public.profiles
  add column avatar_url text check (avatar_url is null or (char_length(avatar_url) <= 500 and avatar_url ~ '^https://'));

alter table public.user_settings
  add column week_start text not null default 'mon' check (week_start in ('mon', 'sun')),
  add column default_visibility public.menu_visibility not null default 'link',
  add column weekday_max_minutes int check (weekday_max_minutes between 10 and 240);

grant update (avatar_url) on public.profiles to authenticated;
grant update (week_start, default_visibility, weekday_max_minutes) on public.user_settings to authenticated;

-- Google (and other OAuth providers) put the photo in user metadata as avatar_url or picture.
create or replace function private.oauth_avatar(meta jsonb) returns text
language sql immutable set search_path = '' as $$
  select case when coalesce(meta ->> 'avatar_url', meta ->> 'picture') ~ '^https://'
              then left(coalesce(meta ->> 'avatar_url', meta ->> 'picture'), 500) end
$$;

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  dn text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    'Planetto cook #' || substr(replace(new.id::text, '-', ''), 1, 4)
  );
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, left(dn, 60), private.oauth_avatar(new.raw_user_meta_data));
  insert into public.user_settings (user_id) values (new.id);
  return new;
end $$;

-- When someone later signs in with Google, fill the photo only if they don't have one yet.
create or replace function private.handle_user_metadata() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles
  set avatar_url = private.oauth_avatar(new.raw_user_meta_data)
  where id = new.id and avatar_url is null and private.oauth_avatar(new.raw_user_meta_data) is not null;
  return new;
end $$;

create trigger on_auth_user_metadata after update of raw_user_meta_data on auth.users
  for each row execute function private.handle_user_metadata();

revoke execute on function private.oauth_avatar(jsonb), private.handle_user_metadata() from public, anon, authenticated;

-- Backfill existing Google users.
update public.profiles p set avatar_url = private.oauth_avatar(u.raw_user_meta_data)
from auth.users u where u.id = p.id and p.avatar_url is null and private.oauth_avatar(u.raw_user_meta_data) is not null;

-- Uploaded photos: public bucket (photos are shown next to names), 2 MB, raster images only (no SVG).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Each user may only write inside their own folder: avatars/<user id>/...
create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Lets the uploader list (and tidy up) only its own previous photos.
create policy avatars_select_own on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
