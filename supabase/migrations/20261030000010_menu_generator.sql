-- Builds Planetto Kitchen market menus from the dish library.
-- private.gen_sequence picks breakfast, lunch and dinner for N days under hard rules
-- (diet, required tags, any-of tags, banned tags, time limit) and soft scores
-- (focus tags, preferred tags, no repeats, weekend dishes on weekends). It is
-- deterministic: the same seed always gives the same plan.
-- private.publish_menu snapshots a slice of that sequence as a public menu.

create or replace function private.diet_allows(menu_diet public.diet_type)
returns public.diet_type[] language sql immutable set search_path = '' as $$
  select case menu_diet
    when 'vegan' then array['vegan']::public.diet_type[]
    when 'jain' then array['jain']::public.diet_type[]
    when 'veg' then array['veg', 'vegan', 'jain']::public.diet_type[]
    when 'egg' then array['veg', 'vegan', 'jain', 'egg']::public.diet_type[]
    else array['veg', 'vegan', 'jain', 'egg', 'nonveg']::public.diet_type[]
  end
$$;

-- Result lands in temp table gen_seq (day_index, meal, dish_id), replaced on each call.
-- prefer entries may be 'diet:<diet>' to favour a dish diet, e.g. 'diet:nonveg'.
create or replace function private.gen_sequence(
  seed text, n_days int, menu_diet public.diet_type,
  need text[] default '{}',      -- every meal must carry all of these
  need_main text[] default '{}', -- lunch and dinner must carry all of these
  any_of text[] default '{}',    -- every meal must carry at least one of these
  ban text[] default '{}',       -- never pick dishes with these
  focus text[] default '{}',     -- +30 per match
  prefer text[] default '{}',    -- +10 per match
  max_minutes int default null   -- hard limit on cook time
) returns int language plpgsql security definer set search_path = '' as $$
declare
  d int;
  m public.meal_type;
  pick uuid;
  picked int := 0;
begin
  create temp table if not exists gen_seq (day_index int, meal public.meal_type, dish_id uuid) on commit drop;
  truncate gen_seq;

  for d in 0 .. n_days - 1 loop
    foreach m in array array['breakfast', 'lunch', 'dinner']::public.meal_type[] loop
      select x.id into pick
      from public.dishes x
      where x.owner_id is null and x.status = 'active' and x.is_public
        and m = any (x.meal_types)
        and x.diet = any (private.diet_allows(menu_diet))
        and x.tags @> need
        and (m = 'breakfast' or x.tags @> need_main)
        and (cardinality(any_of) = 0 or x.tags && any_of)
        and not (x.tags && ban)
        and (max_minutes is null or x.cook_minutes <= max_minutes)
        -- never the same dish twice in one day
        and not exists (select 1 from gen_seq g where g.day_index = d and g.dish_id = x.id)
      order by
        (select count(*) from unnest(x.tags) t where t = any (focus)) * 30
        + (select count(*) from unnest(x.tags) t where t = any (prefer)) * 10
        + case when ('diet:' || x.diet::text) = any (prefer) then 12 else 0 end
        - (select count(*) from gen_seq g where g.dish_id = x.id) * 18
        - case when exists (select 1 from gen_seq g where g.dish_id = x.id and g.day_index >= d - 2) then 40 else 0 end
        + case when d % 7 >= 5 and 'weekend' = any (x.tags) then 8
               when d % 7 < 5 and 'weekend' = any (x.tags) then -15 else 0 end
        - case when d % 7 < 5 and x.cook_minutes > 45 then 12 else 0 end
        + ('x' || substr(md5(seed || ':' || d || ':' || m || ':' || x.id), 1, 2))::bit(8)::int % 10
        desc,
        x.id
      limit 1;

      if pick is null then
        raise exception 'no dish for % day % meal % (seed %)', menu_diet, d, m, seed;
      end if;
      insert into gen_seq values (d, m, pick);
      picked := picked + 1;
    end loop;
  end loop;
  return picked;
end $$;

-- Publishes days [from_day, from_day + n_days) of gen_seq as a public Planetto Kitchen menu.
-- Skips (returns null) if a library menu with this title already exists.
create or replace function private.publish_menu(
  p_title text, p_description text, p_period public.menu_period, from_day int, n_days int,
  p_diet public.diet_type, p_tags text[]
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  new_id uuid;
begin
  if exists (select 1 from public.menus where owner_id is null and title = p_title) then
    return null;
  end if;

  insert into public.menus (owner_id, title, description, period, days, visibility, diet, tags)
  values (null, p_title, p_description, p_period, n_days, 'public', p_diet, p_tags)
  returning id into new_id;

  insert into public.menu_items (menu_id, day_index, meal, is_eatout, dish_name, dish_diet, ingredients, source_dish_id)
  select new_id, g.day_index - from_day, g.meal, false, x.name, x.diet,
         coalesce((select jsonb_agg(jsonb_build_object('name', i.name, 'quantity', i.quantity, 'unit', i.unit) order by i.position)
                   from public.dish_ingredients i where i.dish_id = x.id), '[]'::jsonb),
         x.id
  from gen_seq g join public.dishes x on x.id = g.dish_id
  where g.day_index >= from_day and g.day_index < from_day + n_days;

  return new_id;
end $$;

-- One category = one 28-day sequence -> 4 week menus, 1 month menu, 3 day menus.
create or replace function private.publish_category(
  slug text, label text, blurb text, menu_diet public.diet_type, menu_tags text[],
  need text[] default '{}', need_main text[] default '{}', any_of text[] default '{}',
  ban text[] default '{}', focus text[] default '{}', prefer text[] default '{}', max_minutes int default null
) returns int language plpgsql security definer set search_path = '' as $$
declare
  w int;
  made int := 0;
begin
  perform private.gen_sequence(slug, 28, menu_diet, need, need_main, any_of, ban, focus, prefer, max_minutes);

  for w in 0 .. 3 loop
    if private.publish_menu(label || ' Week ' || (w + 1), blurb, 'week', w * 7, 7, menu_diet, menu_tags) is not null then
      made := made + 1;
    end if;
  end loop;
  if private.publish_menu(label || ' Month', blurb || ' Four different weeks, no dish twice in three days.',
                          'month', 0, 28, menu_diet, menu_tags) is not null then
    made := made + 1;
  end if;
  -- Single days: a weekday, a Saturday and a mid-week day from later weeks.
  if private.publish_menu(label || ' Day: Weekday', blurb, 'day', 2, 1, menu_diet, menu_tags) is not null then made := made + 1; end if;
  if private.publish_menu(label || ' Day: Weekend', blurb, 'day', 12, 1, menu_diet, menu_tags) is not null then made := made + 1; end if;
  if private.publish_menu(label || ' Day: Midweek', blurb, 'day', 17, 1, menu_diet, menu_tags) is not null then made := made + 1; end if;
  return made;
end $$;

revoke execute on function private.gen_sequence(text, int, public.diet_type, text[], text[], text[], text[], text[], text[], int) from public, anon, authenticated;
revoke execute on function private.publish_menu(text, text, public.menu_period, int, int, public.diet_type, text[]) from public, anon, authenticated;
revoke execute on function private.publish_category(text, text, text, public.diet_type, text[], text[], text[], text[], text[], text[], text[], int) from public, anon, authenticated;
