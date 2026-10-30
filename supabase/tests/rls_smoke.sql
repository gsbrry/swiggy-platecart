-- RLS + RPC smoke test. Runs inside a transaction and rolls back; safe on any project.
-- Run with the Supabase SQL editor or `psql -f`. Every row in the output should match the "expect" column.
begin;
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','a@test.dev','{}',now(),now()),
       ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','b@test.dev','{}',now(),now());
insert into public.dishes (id, owner_id, name, diet) values ('33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','A Private','veg');
create temp table r (k text, v text) on commit drop;
grant all on r to authenticated, anon;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
do $$ begin
  begin insert into public.plan_slots (user_id, date, meal, dish_id) values (auth.uid(), current_date, 'lunch', '33333333-3333-3333-3333-333333333333'); insert into r values ('slot with private dish','ALLOWED'); exception when others then insert into r values ('slot with private dish', sqlerrm); end;
  begin update public.dishes set fork_count = 999 where owner_id is null; insert into r values ('fork_count update','ALLOWED'); exception when others then insert into r values ('fork_count update', sqlerrm); end;
  begin update public.dishes set name = 'hacked' where id = '33333333-3333-3333-3333-333333333333'; insert into r values ('rows changed on others dish', (select count(*)::text from public.dishes where name='hacked')); exception when others then insert into r values ('update others dish', sqlerrm); end;
  begin insert into public.menu_ratings (menu_id, user_id, stars) select id, auth.uid(), 5 from public.menus limit 1; insert into r values ('rate without getting','ALLOWED'); exception when others then insert into r values ('rate without getting', sqlerrm); end;
  begin perform public.get_menu((select slug from public.menus where title='Light Reset Day'), current_date, 'overwrite');
        insert into public.menu_ratings (menu_id, user_id, stars, review) select id, auth.uid(), 4, 'nice' from public.menus where title='Light Reset Day';
        insert into r values ('rate after get', (select rating_avg::text || '/' || rating_count from public.menus where title='Light Reset Day')); exception when others then insert into r values ('rate after get', sqlerrm); end;
  begin perform public.admin_set_status('menu', (select id from public.menus limit 1), 'hidden'); insert into r values ('admin rpc','ALLOWED'); exception when others then insert into r values ('admin rpc', sqlerrm); end;
  begin insert into public.menus (owner_id, title, period, days) values (auth.uid(), 'direct', 'day', 1); insert into r values ('direct menu insert','ALLOWED'); exception when others then insert into r values ('direct menu insert', sqlerrm); end;
end $$;
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  begin perform public.get_menu('x', current_date); insert into r values ('anon get_menu','ALLOWED'); exception when others then insert into r values ('anon get_menu', sqlerrm); end;
  insert into r values ('anon settings rows', (select count(*)::text from public.user_settings));
end $$;
reset role;
-- expect: RLS violation, permission denied, 0, RLS violation, 4.00/1, forbidden, permission denied, permission denied, 0
select * from r;
rollback;
