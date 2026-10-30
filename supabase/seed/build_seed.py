"""Generates supabase/seed.sql: the Planetto Kitchen dish library and starter menus.

Run: python3 supabase/seed/build_seed.py > supabase/seed.sql
Idempotent: library rows (owner_id is null) are replaced on each run.
"""
import json

B, L, D = "breakfast", "lunch", "dinner"

# name, meals, diet, minutes, tags, ingredients "name qty unit; ..." (for 2 people)
DISHES = [
    ("Kanda Poha", [B], "veg", 20, ["quick", "light"], "poha 1.5 cup; onion 1 pc; peanuts 2 tbsp; green chilli 2 pc; curry leaves 10 pc; lemon 1 pc"),
    ("Rava Upma", [B], "veg", 20, ["quick"], "semolina 1 cup; onion 1 pc; mixed vegetables 1 cup; mustard seeds 1 tsp; curry leaves 10 pc"),
    ("Idli Sambar", [B], "veg", 30, ["south-indian", "light"], "idli batter 3 cup; toor dal 0.5 cup; drumstick 1 pc; sambar powder 2 tbsp; tamarind 1 tbsp"),
    ("Masala Dosa", [B], "veg", 35, ["south-indian"], "dosa batter 3 cup; potato 3 pc; onion 1 pc; mustard seeds 1 tsp; coconut chutney 1 cup"),
    ("Aloo Paratha + Curd", [B], "veg", 35, ["comfort"], "whole wheat flour 2 cup; potato 3 pc; green chilli 2 pc; ghee 2 tbsp; curd 1 cup"),
    ("Moong Dal Chilla", [B], "veg", 25, ["high-protein"], "moong dal 1 cup; ginger 1 inch; green chilli 1 pc; coriander 0.5 bunch; mint chutney 0.5 cup"),
    ("Besan Chilla", [B], "veg", 20, ["quick", "high-protein"], "besan 1 cup; tomato 1 pc; onion 1 pc; ajwain 0.5 tsp; coriander 0.5 bunch"),
    ("Ragi Dosa", [B], "veg", 25, ["south-indian", "millet"], "ragi flour 1 cup; rice flour 0.5 cup; onion 1 pc; green chilli 1 pc"),
    ("Masala Omelette + Toast", [B], "egg", 15, ["quick", "high-protein"], "eggs 4 pc; onion 1 pc; tomato 1 pc; bread 4 slice; butter 1 tbsp"),
    ("Egg Bhurji Pav", [B], "egg", 20, ["high-protein"], "eggs 4 pc; pav 4 pc; onion 1 pc; tomato 1 pc; pav bhaji masala 1 tsp"),
    ("Sabudana Khichdi", [B], "veg", 25, ["fasting"], "sabudana 1 cup; peanuts 0.25 cup; potato 1 pc; green chilli 2 pc; lemon 1 pc"),
    ("Methi Thepla + Curd", [B, D], "veg", 30, ["gujarati"], "whole wheat flour 2 cup; methi leaves 1 bunch; curd 1 cup; turmeric 0.5 tsp"),
    ("Ven Pongal", [B], "veg", 30, ["south-indian", "comfort"], "rice 0.75 cup; moong dal 0.25 cup; black pepper 1 tsp; cumin 1 tsp; ghee 2 tbsp"),
    ("Banana Oats Porridge", [B], "vegan", 10, ["quick", "light"], "rolled oats 1 cup; banana 2 pc; almond milk 2 cup; cinnamon 0.5 tsp"),
    ("Vegetable Uttapam", [B, D], "veg", 25, ["south-indian"], "dosa batter 3 cup; onion 1 pc; tomato 1 pc; capsicum 1 pc"),
    ("Dal Tadka + Jeera Rice", [L, D], "veg", 40, ["comfort", "high-protein"], "toor dal 1 cup; basmati rice 1 cup; tomato 2 pc; garlic 4 clove; cumin 1 tsp; ghee 1 tbsp"),
    ("Rajma Chawal", [L], "veg", 50, ["comfort", "high-protein"], "rajma 1 cup; rice 1 cup; onion 2 pc; tomato 2 pc; ginger garlic paste 1 tbsp"),
    ("Chole + Roti", [L, D], "veg", 50, ["punjabi", "high-protein"], "kabuli chana 1 cup; onion 2 pc; tomato 2 pc; chole masala 2 tbsp; whole wheat flour 1.5 cup"),
    ("Sambar Rice", [L], "veg", 40, ["south-indian"], "toor dal 0.5 cup; rice 1 cup; mixed vegetables 2 cup; sambar powder 2 tbsp; tamarind 1 tbsp"),
    ("Curd Rice", [L], "veg", 15, ["south-indian", "light", "quick"], "rice 1 cup; curd 2 cup; mustard seeds 1 tsp; curry leaves 10 pc; pomegranate 0.25 cup"),
    ("Veg Pulao + Raita", [L], "veg", 35, ["one-pot"], "basmati rice 1 cup; mixed vegetables 2 cup; whole spices 1 tbsp; curd 1 cup; cucumber 1 pc"),
    ("Palak Dal + Roti", [L, D], "veg", 35, ["high-protein"], "moong dal 0.75 cup; spinach 1 bunch; garlic 4 clove; whole wheat flour 1.5 cup"),
    ("Kadhi Chawal", [L], "veg", 40, ["comfort"], "curd 2 cup; besan 3 tbsp; rice 1 cup; fenugreek seeds 0.5 tsp; curry leaves 10 pc"),
    ("Bhindi Masala + Roti", [L, D], "veg", 30, ["north-indian"], "bhindi 300 g; onion 2 pc; tomato 1 pc; amchur 1 tsp; whole wheat flour 1.5 cup"),
    ("Lemon Rice", [L], "veg", 20, ["south-indian", "quick"], "rice 1 cup; lemon 2 pc; peanuts 2 tbsp; chana dal 1 tbsp; curry leaves 10 pc"),
    ("Veg Biryani", [L, D], "veg", 60, ["weekend"], "basmati rice 1.5 cup; mixed vegetables 2 cup; curd 0.5 cup; biryani masala 2 tbsp; fried onion 0.5 cup"),
    ("Moong Dal Khichdi", [L, D], "veg", 30, ["light", "comfort", "one-pot"], "rice 0.75 cup; moong dal 0.5 cup; ghee 1 tbsp; cumin 1 tsp; turmeric 0.5 tsp"),
    ("Chicken Curry + Rice", [L, D], "nonveg", 50, ["high-protein"], "chicken 500 g; onion 2 pc; tomato 2 pc; ginger garlic paste 1 tbsp; rice 1 cup"),
    ("Fish Curry + Rice", [L, D], "nonveg", 40, ["coastal", "high-protein"], "fish 400 g; coconut milk 1 cup; tamarind 1 tbsp; kokum 3 pc; rice 1 cup"),
    ("Egg Curry + Roti", [L, D], "egg", 35, ["high-protein"], "eggs 4 pc; onion 2 pc; tomato 2 pc; garam masala 1 tsp; whole wheat flour 1.5 cup"),
    ("Dal Dhokli", [L], "jain", 45, ["gujarati", "no-onion-garlic"], "toor dal 0.75 cup; whole wheat flour 1 cup; jaggery 1 tbsp; kokum 2 pc; peanuts 2 tbsp"),
    ("Paneer Bhurji + Roti", [D], "veg", 25, ["high-protein", "quick"], "paneer 200 g; onion 1 pc; tomato 2 pc; capsicum 1 pc; whole wheat flour 1.5 cup"),
    ("Palak Paneer + Roti", [D], "veg", 40, ["north-indian", "high-protein"], "spinach 2 bunch; paneer 200 g; onion 1 pc; cream 2 tbsp; whole wheat flour 1.5 cup"),
    ("Aloo Gobi + Roti", [L, D], "veg", 35, ["north-indian"], "cauliflower 1 pc; potato 2 pc; tomato 1 pc; turmeric 0.5 tsp; whole wheat flour 1.5 cup"),
    ("Vegetable Khichdi", [D], "veg", 35, ["light", "one-pot"], "rice 0.75 cup; moong dal 0.5 cup; mixed vegetables 1.5 cup; ghee 1 tbsp"),
    ("Tofu Stir-fry + Rice", [D], "vegan", 25, ["high-protein", "quick"], "tofu 250 g; broccoli 1 pc; capsicum 1 pc; soy sauce 2 tbsp; rice 1 cup"),
    ("Chana Masala + Rice", [D], "vegan", 45, ["high-protein"], "kabuli chana 1 cup; onion 2 pc; tomato 2 pc; chana masala 2 tbsp; rice 1 cup"),
    ("Mushroom Matar + Roti", [D], "veg", 30, ["north-indian"], "mushroom 200 g; green peas 1 cup; onion 1 pc; tomato 2 pc; whole wheat flour 1.5 cup"),
    ("Lauki Chana Dal + Roti", [D], "veg", 40, ["light", "high-protein"], "lauki 1 pc; chana dal 0.5 cup; tomato 1 pc; whole wheat flour 1.5 cup"),
    ("Dal Makhani + Jeera Rice", [D], "veg", 70, ["weekend", "comfort"], "whole urad dal 0.75 cup; rajma 2 tbsp; butter 2 tbsp; cream 3 tbsp; basmati rice 1 cup"),
    ("Grilled Chicken + Salad", [D], "nonveg", 35, ["high-protein", "light"], "chicken breast 400 g; curd 0.5 cup; lettuce 1 pc; cucumber 1 pc; lemon 1 pc"),
    ("Chicken Tikka Wrap", [L, D], "nonveg", 35, ["high-protein"], "chicken 300 g; tortilla 4 pc; tikka masala 2 tbsp; onion 1 pc; mint chutney 0.5 cup"),
    ("Jain Paneer Capsicum", [D], "jain", 25, ["no-onion-garlic", "high-protein"], "paneer 200 g; capsicum 2 pc; tomato 2 pc; kasuri methi 1 tbsp; whole wheat flour 1.5 cup"),
    ("Soya Chunk Curry + Rice", [L, D], "vegan", 35, ["high-protein", "budget"], "soya chunks 1 cup; onion 1 pc; tomato 2 pc; garam masala 1 tsp; rice 1 cup"),
    ("Sprouts Chaat", [B], "vegan", 15, ["high-protein", "quick", "light"], "moong sprouts 1.5 cup; onion 1 pc; tomato 1 pc; lemon 1 pc; chaat masala 1 tsp"),
    ("Jain Moong Dal Chilla", [B], "jain", 25, ["no-onion-garlic", "high-protein"], "moong dal 1 cup; ginger 1 inch; green chilli 1 pc; coriander 0.5 bunch"),
    ("Jain Khichdi Kadhi", [L, D], "jain", 40, ["no-onion-garlic", "comfort"], "rice 0.75 cup; moong dal 0.5 cup; curd 1.5 cup; besan 2 tbsp; ghee 1 tbsp"),
]

def week(rows):
    """rows: 7 tuples of (breakfast, lunch, dinner); None = empty, 'EAT' = eating out."""
    return rows

MENUS = [
    ("Simple Veg Week", "Everyday North + South Indian veg food. No fancy ingredients, mostly 30 minutes or less.", "week", "veg", ["everyday", "quick"], week([
        ("Kanda Poha", "Dal Tadka + Jeera Rice", "Paneer Bhurji + Roti"),
        ("Rava Upma", "Rajma Chawal", "Aloo Gobi + Roti"),
        ("Idli Sambar", "Curd Rice", "Vegetable Khichdi"),
        ("Besan Chilla", "Chole + Roti", "Mushroom Matar + Roti"),
        ("Methi Thepla + Curd", "Veg Pulao + Raita", "EAT"),
        ("Aloo Paratha + Curd", "Kadhi Chawal", "Palak Paneer + Roti"),
        ("Masala Dosa", "Veg Biryani", "Moong Dal Khichdi"),
    ])),
    ("High-Protein Veg Week", "Dal, paneer, chana and sprouts every day. Roughly 25–30 g protein per meal for one adult.", "week", "veg", ["high-protein", "fitness"], week([
        ("Moong Dal Chilla", "Rajma Chawal", "Paneer Bhurji + Roti"),
        ("Sprouts Chaat", "Chole + Roti", "Palak Paneer + Roti"),
        ("Besan Chilla", "Palak Dal + Roti", "Tofu Stir-fry + Rice"),
        ("Moong Dal Chilla", "Dal Tadka + Jeera Rice", "Lauki Chana Dal + Roti"),
        ("Sprouts Chaat", "Soya Chunk Curry + Rice", "Paneer Bhurji + Roti"),
        ("Besan Chilla", "Rajma Chawal", "Chana Masala + Rice"),
        ("Moong Dal Chilla", "Chole + Roti", "Palak Paneer + Roti"),
    ])),
    ("South Indian Week", "Idli, dosa, pongal, sambar and curd rice. Batter once, eat all week.", "week", "veg", ["south-indian"], week([
        ("Idli Sambar", "Sambar Rice", "Vegetable Uttapam"),
        ("Ven Pongal", "Lemon Rice", "Masala Dosa"),
        ("Ragi Dosa", "Curd Rice", "Vegetable Khichdi"),
        ("Idli Sambar", "Sambar Rice", "Vegetable Uttapam"),
        ("Masala Dosa", "Lemon Rice", "Moong Dal Khichdi"),
        ("Ven Pongal", "Curd Rice", "EAT"),
        ("Ragi Dosa", "Sambar Rice", "Vegetable Uttapam"),
    ])),
    ("Student Budget Week", "Cheap staples, one-pot dinners and lots of dal. Built for a small kitchen and a tight budget.", "week", "veg", ["budget", "one-pot"], week([
        ("Kanda Poha", "Moong Dal Khichdi", "Soya Chunk Curry + Rice"),
        ("Banana Oats Porridge", "Dal Tadka + Jeera Rice", "Vegetable Khichdi"),
        ("Besan Chilla", "Lemon Rice", "Chana Masala + Rice"),
        ("Rava Upma", "Curd Rice", "Moong Dal Khichdi"),
        ("Kanda Poha", "Kadhi Chawal", "EAT"),
        ("Banana Oats Porridge", "Rajma Chawal", "Soya Chunk Curry + Rice"),
        ("Aloo Paratha + Curd", "Veg Pulao + Raita", "Vegetable Khichdi"),
    ])),
    ("Eggetarian Week", "Veg meals with eggs for breakfast and a couple of dinners.", "week", "egg", ["high-protein"], week([
        ("Masala Omelette + Toast", "Dal Tadka + Jeera Rice", "Egg Curry + Roti"),
        ("Egg Bhurji Pav", "Rajma Chawal", "Palak Paneer + Roti"),
        ("Masala Omelette + Toast", "Veg Pulao + Raita", "Aloo Gobi + Roti"),
        ("Besan Chilla", "Chole + Roti", "Egg Curry + Roti"),
        ("Egg Bhurji Pav", "Curd Rice", "EAT"),
        ("Masala Omelette + Toast", "Kadhi Chawal", "Paneer Bhurji + Roti"),
        ("Egg Bhurji Pav", "Veg Biryani", "Moong Dal Khichdi"),
    ])),
    ("Lean Non-Veg Week", "Chicken, fish and eggs with simple sides. High protein, light dinners.", "week", "nonveg", ["high-protein", "fitness"], week([
        ("Masala Omelette + Toast", "Chicken Curry + Rice", "Grilled Chicken + Salad"),
        ("Moong Dal Chilla", "Fish Curry + Rice", "Palak Dal + Roti"),
        ("Egg Bhurji Pav", "Chicken Tikka Wrap", "Vegetable Khichdi"),
        ("Masala Omelette + Toast", "Dal Tadka + Jeera Rice", "Grilled Chicken + Salad"),
        ("Sprouts Chaat", "Fish Curry + Rice", "EAT"),
        ("Egg Bhurji Pav", "Chicken Curry + Rice", "Egg Curry + Roti"),
        ("Masala Omelette + Toast", "Rajma Chawal", "Grilled Chicken + Salad"),
    ])),
    ("Jain Week", "No onion, no garlic, no root vegetables.", "week", "jain", ["no-onion-garlic"], week([
        ("Jain Moong Dal Chilla", "Dal Dhokli", "Jain Paneer Capsicum"),
        ("Jain Moong Dal Chilla", "Jain Khichdi Kadhi", "Jain Paneer Capsicum"),
        ("Jain Moong Dal Chilla", "Dal Dhokli", "Jain Khichdi Kadhi"),
        ("Jain Moong Dal Chilla", "Jain Khichdi Kadhi", "Jain Paneer Capsicum"),
        ("Jain Moong Dal Chilla", "Dal Dhokli", "Jain Khichdi Kadhi"),
        ("Jain Moong Dal Chilla", "Jain Khichdi Kadhi", "Jain Paneer Capsicum"),
        ("Jain Moong Dal Chilla", "Dal Dhokli", "Jain Khichdi Kadhi"),
    ])),
    ("Light Reset Day", "A gentle day after a heavy weekend: oats, curd rice and khichdi.", "day", "veg", ["light"], week([
        ("Banana Oats Porridge", "Curd Rice", "Moong Dal Khichdi"),
    ])),
    ("Sunday Feast", "Aloo paratha brunch, veg biryani lunch and dal makhani dinner.", "day", "veg", ["weekend"], week([
        ("Aloo Paratha + Curd", "Veg Biryani", "Dal Makhani + Jeera Rice"),
    ])),
]

# A 4-week month that rotates the first three week menus plus the budget week.
MONTH_SOURCES = [0, 2, 1, 3]
MENUS.append((
    "Balanced Veg Month",
    "Four different veg weeks back to back: everyday, South Indian, high-protein and budget.",
    "month", "veg", ["everyday", "variety"],
    [day for i in MONTH_SOURCES for day in MENUS[i][5]],
))

def q(s):
    return "'" + s.replace("'", "''") + "'"

def parse_ingredients(spec):
    out = []
    for part in spec.split(";"):
        bits = part.strip().rsplit(" ", 2)
        name, qty, unit = bits[0], bits[1], bits[2]
        out.append({"name": name, "quantity": float(qty), "unit": unit})
    return out

by_name = {d[0]: d for d in DISHES}
lines = ["-- Generated by supabase/seed/build_seed.py. Do not edit by hand.", "begin;",
         "delete from public.menus where owner_id is null;",
         "delete from public.dishes where owner_id is null;"]

def arr(items, typ):
    return "array[" + ",".join(q(i) for i in items) + f"]::{typ}[]"

dish_rows = ",\n".join(
    f"({k},{q(n)},{arr(m, 'public.meal_type')},{q(d)},{t},{arr(tags, 'text')},{q(json.dumps(parse_ingredients(i), separators=(',', ':')))})"
    for k, (n, m, d, t, tags, i) in enumerate(DISHES)
)
lines.append(f"""create temp table seed_dishes (ord int, name text, meals public.meal_type[], diet public.diet_type, minutes int, tags text[], ing jsonb) on commit drop;
insert into seed_dishes (ord, name, meals, diet, minutes, tags, ing) values
{dish_rows};
insert into public.dishes (owner_id, name, meal_types, diet, tags, cook_minutes, is_public)
select null, name, meals, diet, tags, minutes, true from seed_dishes;
insert into public.dish_ingredients (dish_id, position, name, quantity, unit)
select d.id, x.ord - 1, x.val ->> 'name', (x.val ->> 'quantity')::numeric, x.val ->> 'unit'
from seed_dishes s join public.dishes d on d.owner_id is null and d.name = s.name,
     jsonb_array_elements(s.ing) with ordinality as x(val, ord);""")

meal_order = [B, L, D]
dish_idx = {d[0]: i for i, d in enumerate(DISHES)}
menu_rows, item_rows = [], []
for mi, (title, desc, period, diet, tags, days) in enumerate(MENUS):
    n_days = {"day": 1, "week": 7, "month": 28}[period]
    assert len(days) == n_days, title
    menu_rows.append(f"({mi},{q(title)},{q(desc)},{q(period)},{n_days},{q(diet)},{arr(tags, 'text')})")
    for di, row in enumerate(days):
        for meal, dish in zip(meal_order, row):
            if dish is None:
                continue
            assert dish == "EAT" or dish in dish_idx, dish
            item_rows.append(f"({mi},{di},{meal_order.index(meal)},{dish_idx[dish] if dish != 'EAT' else 'null'})")

lines.append("""create temp table seed_menus (idx int, title text, description text, period public.menu_period, days int, diet public.diet_type, tags text[]) on commit drop;
insert into seed_menus values
""" + ",\n".join(menu_rows) + """;
insert into public.menus (owner_id, title, description, period, days, visibility, diet, tags)
select null, title, description, period, days, 'public', diet, tags from seed_menus order by idx;""")
lines.append(f"""insert into public.menu_items (menu_id, day_index, meal, is_eatout, dish_name, dish_diet, ingredients, source_dish_id)
select m.id, v.d, (array['breakfast','lunch','dinner']::public.meal_type[])[v.ml + 1], v.dish is null, d.name, d.diet,
  coalesce((select jsonb_agg(jsonb_build_object('name', i.name, 'quantity', i.quantity, 'unit', i.unit) order by i.position)
            from public.dish_ingredients i where i.dish_id = d.id), '[]'::jsonb), d.id
from (values {",".join(item_rows)}) as v(mi, d, ml, dish)
join seed_menus sm on sm.idx = v.mi
join public.menus m on m.owner_id is null and m.title = sm.title
left join seed_dishes sd on sd.ord = v.dish
left join public.dishes d on d.owner_id is null and d.name = sd.name;""")
lines.append("commit;")
print("\n".join(lines))
