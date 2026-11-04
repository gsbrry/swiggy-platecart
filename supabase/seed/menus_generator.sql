-- Planetto Kitchen market: 25 categories x (4 weeks + 1 month + 3 days) = 200 menus.
-- Needs migration 20261030000010_menu_generator.sql and the dish library (supabase/seed/library).
-- Safe to re-run: menus whose title already exists are skipped.
-- First menu tag is the category used by the Market filter.
select sum(made) as menus_added from (
  select private.publish_category('everyday-veg', 'Everyday Veg', 'Simple home food from across India. Mostly under 45 minutes on weekdays.',
    'veg', array['everyday','veg'], prefer => array['quick','comfort','budget']) as made
  union all select private.publish_category('healthy', 'Healthy Balanced', 'Light, high-fibre meals with millets, dals and vegetables. Fried and heavy dishes left out.',
    'veg', array['healthy','light'], ban => array['high-calorie','street-food'], prefer => array['light','high-fibre','millet','high-protein'])
  union all select private.publish_category('high-protein-veg', 'High-Protein Veg', 'Paneer, dal, chana, soya and sprouts at every lunch and dinner.',
    'veg', array['high-protein','veg'], need_main => array['high-protein'], prefer => array['high-protein'])
  union all select private.publish_category('nonveg-family', 'Non-Veg Family', 'Chicken, mutton, fish and egg through the week, with veg days in between.',
    'nonveg', array['non-veg','everyday'], prefer => array['diet:nonveg','diet:egg','comfort'])
  union all select private.publish_category('fat-loss', 'Lean Non-Veg Fat Loss', 'High-protein lunches and dinners, light and low-carb picks first. No fried or heavy dishes.',
    'nonveg', array['fat-loss','high-protein'], need_main => array['high-protein'], ban => array['high-calorie','street-food'], prefer => array['light','low-carb','diet:nonveg'])
  union all select private.publish_category('muscle-gain', 'Muscle Gain', 'Protein at every meal, with enough rice and roti to fuel training.',
    'nonveg', array['muscle-gain','high-protein'], need => array['high-protein'], prefer => array['high-calorie','diet:nonveg','diet:egg'])
  union all select private.publish_category('weight-gain-veg', 'Weight Gain Veg', 'Calorie-dense veg food: parathas, paneer, ghee, nuts and shakes.',
    'veg', array['weight-gain','veg'], ban => array['light'], prefer => array['high-calorie','high-protein'])
  union all select private.publish_category('weight-loss-veg', 'Weight Loss Veg', 'Lighter veg meals with millets, salads and soups. Fried and heavy dishes left out.',
    'veg', array['weight-loss','veg'], ban => array['high-calorie','street-food','weekend'], prefer => array['light','high-fibre','low-carb','millet'])
  union all select private.publish_category('keto', 'Keto', 'Every meal is keto-tagged: no rice, wheat, potato or sugar. Eggs, paneer, chicken, fish and greens.',
    'nonveg', array['keto','low-carb'], need => array['keto'])
  union all select private.publish_category('low-carb', 'Carb Cut', 'Low-carb lunches and dinners, protein-first breakfasts.',
    'nonveg', array['low-carb','high-protein'], need_main => array['low-carb'], prefer => array['high-protein','low-carb'])
  union all select private.publish_category('eggetarian', 'Eggetarian', 'Veg food with eggs most mornings and a few egg dinners.',
    'egg', array['eggetarian','high-protein'], prefer => array['diet:egg','high-protein'])
  union all select private.publish_category('vegan', 'Vegan', 'No dairy, no eggs, no meat. Dals, millets, sprouts and South Indian staples.',
    'vegan', array['vegan'])
  union all select private.publish_category('jain', 'Jain', 'No onion, garlic or root vegetables. Dishes repeat more often: the Jain library is still growing.',
    'jain', array['jain','no-onion-garlic'])
  union all select private.publish_category('south-indian', 'South Indian', 'Idli, dosa, appam, sambar, rasam and curd rice from Kerala to Andhra.',
    'veg', array['south-indian','veg'], any_of => array['south-indian','kerala','tamil','andhra','karnataka'])
  union all select private.publish_category('north-indian', 'North Indian', 'Parathas, dal, rajma, chole and paneer from Punjab and the North.',
    'veg', array['north-indian','veg'], any_of => array['north-indian','punjabi','kashmiri','rajasthani'])
  union all select private.publish_category('gujarati', 'Gujarati & Rajasthani', 'Dhokla, handvo, thepla, dal-bhaat and dal baati, with everyday Indian food in between.',
    'veg', array['gujarati','veg'], focus => array['gujarati','rajasthani'])
  union all select private.publish_category('maharashtrian', 'Maharashtrian', 'Poha, misal, varan bhaat, bhakri and pithla, with everyday Indian food in between.',
    'veg', array['maharashtrian','veg'], focus => array['maharashtrian'])
  union all select private.publish_category('bengali', 'Bengali & Odia', 'Machher jhol, kosha mangsho, shukto, ghugni and dalma.',
    'nonveg', array['bengali','non-veg'], focus => array['bengali','odia'])
  union all select private.publish_category('kerala', 'Kerala', 'Puttu, appam, stew, fish curry and Kerala meals.',
    'nonveg', array['kerala','non-veg'], focus => array['kerala'])
  union all select private.publish_category('budget', 'Student Budget', 'Cheap staples and one-pot meals. Nothing over 40 minutes.',
    'veg', array['budget','veg'], ban => array['weekend'], prefer => array['budget','one-pot','quick'], max_minutes => 40)
  union all select private.publish_category('quick', 'Quick 30-Minute', 'Every meal is ready in 30 minutes or less.',
    'veg', array['quick','veg'], max_minutes => 30, prefer => array['quick'])
  union all select private.publish_category('kids', 'Kids'' Tiffin', 'Mild, familiar food children usually eat: sandwiches, pulao, dosa, noodles.',
    'veg', array['kids','veg'], prefer => array['kid-friendly','quick'])
  union all select private.publish_category('english', 'English & Continental', 'Full English, pasta, pies, roasts and salads.',
    'nonveg', array['english','continental'], any_of => array['english','continental'])
  union all select private.publish_category('continental-veg', 'Indo-Continental Veg', 'Continental breakfasts and dinners, Indian lunches. All vegetarian.',
    'veg', array['continental','veg'], focus => array['english','continental'])
  union all select private.publish_category('millet', 'Millet & Fibre', 'Ragi, jowar, bajra and millets most days, with high-fibre sides.',
    'veg', array['millet','healthy'], focus => array['millet'], prefer => array['high-fibre','light'])
) s;
