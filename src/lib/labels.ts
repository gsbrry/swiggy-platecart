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
