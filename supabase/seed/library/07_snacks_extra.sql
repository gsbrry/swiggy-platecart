select private.load_dishes($batch$
# Batch 7: snacks and fillers across regions. Quantities for 2 people.
Samosa + Chutney|s|veg|50|north-indian,tea-time,street-food|maida:1:cup;potato:3:pc;green peas:0.25:cup;oil for frying:1:cup;tamarind chutney:0.25:cup
Onion Pakoda|s|vegan|25|tea-time,budget|besan:1:cup;onion:3:pc;green chilli:2:pc;ajwain:0.5:tsp;oil for frying:1:cup
Bread Pakoda|s|veg|20|north-indian,tea-time,quick|bread:6:slice;besan:0.75:cup;potato:2:pc;green chutney:3:tbsp;oil for frying:1:cup
Vada Pav|s|veg|40|maharashtrian,street-food|potato:3:pc;besan:0.75:cup;pav:4:pc;garlic chutney:2:tbsp;oil for frying:1:cup
Sabudana Vada|s|veg|40|maharashtrian,tea-time|sabudana:1:cup;potato:2:pc;peanuts:0.5:cup;green chilli:2:pc;oil for frying:1:cup
Dhokla|bs|veg|35|gujarati,light,tea-time|besan:1:cup;curd:0.5:cup;eno:1:tsp;mustard seeds:1:tsp;curry leaves:8:pc
Bhel Puri|s|vegan|10|street-food,quick,light|puffed rice:3:cup;onion:1:pc;tomato:1:pc;sev:0.5:cup;tamarind chutney:3:tbsp
Sundal|s|vegan|20|tamil,high-protein,light|kabuli chana boiled:1.5:cup;grated coconut:3:tbsp;mustard seeds:1:tsp;curry leaves:8:pc
Ragi Malt|bs|veg|10|karnataka,millet,light,quick|ragi flour:3:tbsp;milk:2:cup;jaggery:1:tbsp;cardamom:2:pc
Banana Chips + Chai|s|vegan|5|kerala,tea-time,quick|banana chips:1:cup;tea leaves:2:tsp;milk:1:cup;sugar:2:tsp
Egg Puff|s|egg|35|kerala,tea-time,bakery|puff pastry:2:sheet;eggs:2:pc;onion:2:pc;garam masala:0.5:tsp
Chicken Cutlet|s|nonveg|40|kerala,tea-time,high-protein|chicken:300:g;potato:2:pc;eggs:1:pc;breadcrumbs:0.5:cup;oil for frying:1:cup
Fruit Chaat|s|vegan|10|light,quick,kid-friendly|apple:1:pc;banana:1:pc;papaya:1:cup;pomegranate:0.5:cup;chaat masala:1:tsp
Corn Chaat|s|veg|10|quick,light,kid-friendly|sweet corn:2:cup;butter:1:tbsp;onion:1:pc;lemon:1:pc;chaat masala:1:tsp
Masala Peanuts|s|vegan|15|tea-time,budget,high-protein|peanuts:1:cup;besan:3:tbsp;red chilli powder:1:tsp;oil for frying:0.5:cup
Hummus + Veg Sticks|s|vegan|15|continental,light|kabuli chana boiled:1.5:cup;tahini:2:tbsp;lemon:1:pc;carrot:2:pc;cucumber:1:pc
Cheese Toast|s|veg|10|continental,quick,kid-friendly|bread:4:slice;cheese:80:g;butter:1:tbsp;oregano:0.5:tsp
Banana Walnut Muffin|s|egg|35|continental,bakery,tea-time|maida:1:cup;banana:2:pc;eggs:1:pc;walnuts:0.25:cup;butter:3:tbsp
Paneer Tikka Roll|ls|veg|30|north-indian,street-food,high-protein|paneer:200:g;whole wheat flour:1.5:cup;onion:1:pc;hung curd:0.25:cup;green chutney:3:tbsp
Masala Chaas + Khakhra|s|veg|5|gujarati,light,quick|curd:1:cup;roasted cumin powder:0.5:tsp;mint:0.25:bunch;methi khakhra:4:pc
$batch$) as added;

-- Fix: Jain food avoids fresh ginger (a root); use dry ginger powder.
update public.dish_ingredients i set name = 'dry ginger powder', quantity = 0.5, unit = 'tsp'
from public.dishes d
where i.dish_id = d.id and d.owner_id is null and d.name = 'Jain Moong Dal Chilla' and i.name ilike '%ginger%';
