-- "for all" write policies also apply to SELECT, doubling policy checks on reads. Split them per action.
drop policy ingredients_write on public.dish_ingredients;
create policy ingredients_insert on public.dish_ingredients for insert to authenticated
  with check (exists (select 1 from public.dishes d where d.id = dish_id and d.owner_id = (select auth.uid())));
create policy ingredients_update on public.dish_ingredients for update to authenticated
  using (exists (select 1 from public.dishes d where d.id = dish_id and d.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.dishes d where d.id = dish_id and d.owner_id = (select auth.uid())));
create policy ingredients_delete on public.dish_ingredients for delete to authenticated
  using (exists (select 1 from public.dishes d where d.id = dish_id and d.owner_id = (select auth.uid())));

drop policy menu_items_write on public.menu_items;
create policy menu_items_update on public.menu_items for update to authenticated
  using (exists (select 1 from public.menus m where m.id = menu_id and m.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.menus m where m.id = menu_id and m.owner_id = (select auth.uid())));
create policy menu_items_delete on public.menu_items for delete to authenticated
  using (exists (select 1 from public.menus m where m.id = menu_id and m.owner_id = (select auth.uid())));
