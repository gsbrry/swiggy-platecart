import type { Enums } from "@/lib/supabase/types";

export type Diet = Enums<"diet_type">;
export type Meal = Enums<"meal_type">;
export type Period = Enums<"menu_period">;
export type Visibility = Enums<"menu_visibility">;

export const MEALS: Meal[] = ["breakfast", "lunch", "dinner"];
export const DIETS: Diet[] = ["veg", "egg", "nonveg", "vegan", "jain"];
export const PERIODS: Period[] = ["day", "week", "month"];

export const MEAL_LABEL: Record<Meal, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };
export const DIET_LABEL: Record<Diet, string> = {
  veg: "Veg",
  egg: "Eggetarian",
  nonveg: "Non-veg",
  vegan: "Vegan",
  jain: "Jain",
};
export const PERIOD_LABEL: Record<Period, string> = { day: "Day", week: "Week", month: "Month" };
export const PERIOD_DAYS: Record<Period, number> = { day: 1, week: 7, month: 28 };
export const VISIBILITY_LABEL: Record<Visibility, string> = {
  private: "Only me",
  link: "Anyone with the link",
  public: "Public in Market",
};

/** Which dishes a diet can eat. Veg eaters see veg/vegan/jain; non-veg sees everything. */
export const DIET_ALLOWS: Record<Diet, Diet[]> = {
  vegan: ["vegan"],
  jain: ["jain"],
  veg: ["veg", "vegan", "jain"],
  egg: ["veg", "vegan", "jain", "egg"],
  nonveg: ["veg", "vegan", "jain", "egg", "nonveg"],
};

export const DIET_DOT: Record<Diet, string> = {
  veg: "bg-success",
  vegan: "bg-success",
  jain: "bg-success",
  egg: "bg-warning",
  nonveg: "bg-danger",
};

/** Market categories: the first tag on each Planetto Kitchen menu. Order = chip order. */
export const MENU_CATEGORIES: { tag: string; label: string }[] = [
  { tag: "everyday", label: "Everyday" },
  { tag: "healthy", label: "Healthy" },
  { tag: "high-protein", label: "High protein" },
  { tag: "weight-loss", label: "Weight loss" },
  { tag: "fat-loss", label: "Fat loss" },
  { tag: "weight-gain", label: "Weight gain" },
  { tag: "muscle-gain", label: "Muscle gain" },
  { tag: "keto", label: "Keto" },
  { tag: "low-carb", label: "Carb cut" },
  { tag: "non-veg", label: "Non-veg" },
  { tag: "eggetarian", label: "Eggetarian" },
  { tag: "vegan", label: "Vegan" },
  { tag: "jain", label: "Jain" },
  { tag: "millet", label: "Millets" },
  { tag: "south-indian", label: "South Indian" },
  { tag: "north-indian", label: "North Indian" },
  { tag: "gujarati", label: "Gujarati" },
  { tag: "maharashtrian", label: "Maharashtrian" },
  { tag: "bengali", label: "Bengali" },
  { tag: "kerala", label: "Kerala" },
  { tag: "english", label: "English" },
  { tag: "continental", label: "Continental" },
  { tag: "budget", label: "Budget" },
  { tag: "quick", label: "Quick" },
  { tag: "kids", label: "Kids" },
];

/** Menus with these tags get a "not medical advice" note. */
export const HEALTH_TAGS = ["weight-loss", "fat-loss", "weight-gain", "muscle-gain", "keto", "low-carb", "high-protein", "healthy"];
