-- Create or update a dish and replace its ingredients in one transaction.
-- SECURITY INVOKER: RLS on dishes/dish_ingredients still decides what the caller may write.
create or replace function public.save_dish(p_id uuid, p_dish jsonb, p_ingredients jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  did uuid := p_id;
begin
  if uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if jsonb_array_length(coalesce(p_ingredients, '[]'::jsonb)) > 40 then
    raise exception 'A dish can have at most 40 ingredients.' using errcode = 'P0001';
  end if;

  if did is null then
    insert into public.dishes (owner_id, name, description, meal_types, diet, tags, cook_minutes, steps, is_public)
    values (
      uid,
      p_dish ->> 'name',
      nullif(p_dish ->> 'description', ''),
      coalesce((select array_agg(x::public.meal_type) from jsonb_array_elements_text(p_dish -> 'meal_types') x), '{}'),
      (p_dish ->> 'diet')::public.diet_type,
      coalesce((select array_agg(x) from jsonb_array_elements_text(p_dish -> 'tags') x), '{}'),
      nullif(p_dish ->> 'cook_minutes', '')::int,
      nullif(p_dish ->> 'steps', ''),
      coalesce((p_dish ->> 'is_public')::boolean, false)
    )
    returning id into did;
  else
    update public.dishes set
      name = p_dish ->> 'name',
      description = nullif(p_dish ->> 'description', ''),
      meal_types = coalesce((select array_agg(x::public.meal_type) from jsonb_array_elements_text(p_dish -> 'meal_types') x), '{}'),
      diet = (p_dish ->> 'diet')::public.diet_type,
      tags = coalesce((select array_agg(x) from jsonb_array_elements_text(p_dish -> 'tags') x), '{}'),
      cook_minutes = nullif(p_dish ->> 'cook_minutes', '')::int,
      steps = nullif(p_dish ->> 'steps', ''),
      is_public = coalesce((p_dish ->> 'is_public')::boolean, false)
    where id = did and owner_id = uid;
    if not found then raise exception 'dish not found' using errcode = 'P0002'; end if;
    delete from public.dish_ingredients where dish_id = did;
  end if;

  insert into public.dish_ingredients (dish_id, position, name, quantity, unit)
  select did, (e.ord - 1)::int, e.val ->> 'name', nullif(e.val ->> 'quantity', '')::numeric, nullif(e.val ->> 'unit', '')
  from jsonb_array_elements(coalesce(p_ingredients, '[]'::jsonb)) with ordinality as e(val, ord)
  where coalesce(trim(e.val ->> 'name'), '') <> '';

  return did;
end $$;

revoke execute on function public.save_dish(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_dish(uuid, jsonb, jsonb) to authenticated;
