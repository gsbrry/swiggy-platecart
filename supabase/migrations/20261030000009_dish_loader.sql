-- Loads Planetto Kitchen library dishes from a compact text format (one dish per line):
--   Name|meals|diet|minutes|tag,tag|ingredient:qty:unit;ingredient:qty:unit
-- meals: letters b (breakfast) l (lunch) s (snack) d (dinner). Quantities are for 2 people.
-- Lines starting with # are comments. Existing library dishes (same name) are left untouched.
create or replace function private.load_dishes(batch text) returns int
language plpgsql security definer set search_path = '' as $$
declare
  line text;
  f text[];
  meals public.meal_type[];
  new_id uuid;
  added int := 0;
begin
  foreach line in array string_to_array(batch, E'\n') loop
    line := trim(line);
    continue when line = '' or left(line, 1) = '#';
    f := string_to_array(line, '|');
    if array_length(f, 1) <> 6 then raise exception 'bad line (need 6 fields): %', line; end if;
    continue when exists (select 1 from public.dishes where owner_id is null and name = trim(f[1]));

    meals := array(
      select m::public.meal_type from unnest(array[
        case when position('b' in f[2]) > 0 then 'breakfast' end,
        case when position('l' in f[2]) > 0 then 'lunch' end,
        case when position('s' in f[2]) > 0 then 'snack' end,
        case when position('d' in f[2]) > 0 then 'dinner' end
      ]) m where m is not null
    );
    if cardinality(meals) = 0 then raise exception 'no meals in: %', line; end if;

    insert into public.dishes (owner_id, name, meal_types, diet, tags, cook_minutes, is_public)
    values (null, trim(f[1]), meals, trim(f[3])::public.diet_type,
            array(select trim(t) from unnest(string_to_array(f[5], ',')) t where trim(t) <> ''),
            trim(f[4])::int, true)
    returning id into new_id;

    insert into public.dish_ingredients (dish_id, position, name, quantity, unit)
    select new_id, (x.ord - 1)::int, trim(split_part(x.item, ':', 1)),
           nullif(trim(split_part(x.item, ':', 2)), '')::numeric,
           nullif(trim(split_part(x.item, ':', 3)), '')
    from unnest(string_to_array(f[6], ';')) with ordinality as x(item, ord)
    where trim(split_part(x.item, ':', 1)) <> '';
    added := added + 1;
  end loop;
  return added;
end $$;

revoke execute on function private.load_dishes(text) from public, anon, authenticated;
