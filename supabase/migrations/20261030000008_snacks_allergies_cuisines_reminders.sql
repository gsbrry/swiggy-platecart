-- Snack / evening tiffin as a 4th meal, allergies, favourite cuisines, and the Sunday planning reminder.

alter type public.meal_type add value if not exists 'snack' after 'lunch';

alter table public.user_settings
  add column show_snacks boolean not null default false,
  add column allergies text[] not null default '{}' check (cardinality(allergies) <= 12),
  add column cuisines text[] not null default '{}' check (cardinality(cuisines) <= 12),
  add column weekly_reminder boolean not null default false,
  add column last_reminder_at timestamptz,
  add column reminder_token uuid not null default gen_random_uuid() unique;

grant update (show_snacks, allergies, cuisines, weekly_reminder) on public.user_settings to authenticated;

-- One-click unsubscribe from the reminder email, without signing in. The token is the only credential.
create or replace function public.unsubscribe_reminder(p_token uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.user_settings set weekly_reminder = false where reminder_token = p_token;
  return found;
end $$;
revoke execute on function public.unsubscribe_reminder(uuid) from public;
grant execute on function public.unsubscribe_reminder(uuid) to anon, authenticated;

-- Starter snack / evening tiffin dishes for the Planetto Kitchen library (applied 30 Oct 2026).
with s(name, diet, minutes, tags, ing) as (values
  ('Masala Chai + Marie Biscuits','veg',10,array['tea-time','quick'],'[{"name":"tea leaves","quantity":2,"unit":"tsp"},{"name":"milk","quantity":1,"unit":"cup"},{"name":"ginger","quantity":0.5,"unit":"inch"},{"name":"marie biscuits","quantity":8,"unit":"pc"}]'),
  ('Roasted Makhana','veg',10,array['tea-time','light','quick'],'[{"name":"makhana","quantity":2,"unit":"cup"},{"name":"ghee","quantity":1,"unit":"tsp"},{"name":"black pepper","quantity":0.5,"unit":"tsp"}]'),
  ('Fruit Chaat','vegan',10,array['light','quick'],'[{"name":"banana","quantity":1,"unit":"pc"},{"name":"apple","quantity":1,"unit":"pc"},{"name":"papaya","quantity":1,"unit":"cup"},{"name":"chaat masala","quantity":1,"unit":"tsp"}]'),
  ('Chana Sundal','vegan',15,array['south-indian','high-protein'],'[{"name":"kabuli chana","quantity":1,"unit":"cup"},{"name":"grated coconut","quantity":3,"unit":"tbsp"},{"name":"mustard seeds","quantity":1,"unit":"tsp"},{"name":"curry leaves","quantity":8,"unit":"pc"}]'),
  ('Khaman Dhokla','veg',30,array['gujarati','tea-time'],'[{"name":"besan","quantity":1,"unit":"cup"},{"name":"curd","quantity":0.5,"unit":"cup"},{"name":"eno","quantity":1,"unit":"tsp"},{"name":"mustard seeds","quantity":1,"unit":"tsp"}]'),
  ('Poha Chivda','vegan',20,array['tea-time'],'[{"name":"thin poha","quantity":2,"unit":"cup"},{"name":"peanuts","quantity":0.25,"unit":"cup"},{"name":"curry leaves","quantity":10,"unit":"pc"},{"name":"turmeric","quantity":0.5,"unit":"tsp"}]'),
  ('Bhel Puri','vegan',15,array['street-food','quick'],'[{"name":"puffed rice","quantity":2,"unit":"cup"},{"name":"sev","quantity":0.5,"unit":"cup"},{"name":"onion","quantity":1,"unit":"pc"},{"name":"tamarind chutney","quantity":3,"unit":"tbsp"}]'),
  ('Boiled Egg Chaat','egg',15,array['high-protein','quick'],'[{"name":"eggs","quantity":4,"unit":"pc"},{"name":"onion","quantity":1,"unit":"pc"},{"name":"chaat masala","quantity":1,"unit":"tsp"},{"name":"lemon","quantity":1,"unit":"pc"}]')
), ins as (
  insert into public.dishes (owner_id, name, meal_types, diet, tags, cook_minutes, is_public)
  select null, s.name, array['snack']::public.meal_type[], s.diet::public.diet_type, s.tags, s.minutes, true
  from s where not exists (select 1 from public.dishes d where d.owner_id is null and d.name = s.name)
  returning id, name
)
insert into public.dish_ingredients (dish_id, position, name, quantity, unit)
select ins.id, x.ord - 1, x.val ->> 'name', (x.val ->> 'quantity')::numeric, x.val ->> 'unit'
from ins join s on s.name = ins.name, jsonb_array_elements(s.ing::jsonb) with ordinality as x(val, ord);
update public.dishes set meal_types = array_append(meal_types, 'snack')
where owner_id is null and name = 'Sprouts Chaat' and not ('snack' = any(meal_types));
