export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "any" | "";
export type Difficulty = "easy" | "medium" | "hard";
export type DietTag =
  | "veg"
  | "nonveg"
  | "vegan"
  | "keto"
  | "jain"
  | "glutenfree";
export type GoalTag =
  | "quick"
  | "protein"
  | "light"
  | "weight-loss"
  | "muscle-gain"
  | "maintain";
export type Visibility = "public" | "private";
export type Unit = "g" | "kg" | "ml" | "l" | "tsp" | "tbsp" | "pc" | "cup";

export type IngredientRow = {
  id: string;
  name: string;
  qty: string;
  unit: Unit;
};

export type StepRow = {
  id: string;
  text: string;
};

export type TemplateDraft = {
  dishName: string;
  mealType: MealType;
  servings: number;
  prepMinutes: number;
  difficulty: Difficulty;
  costPerServing: string;
  diet: DietTag | null;
  goalTags: GoalTag[];
  ingredients: IngredientRow[];
  steps: StepRow[];
  visibility: Visibility;
};

export type TemplatePayload = {
  dish_name: string;
  meal_type: MealType;
  diet_type: DietTag | null;
  prep_minutes: number;
  default_servings: number;
  difficulty: Difficulty;
  cost_per_serving_inr: number | null;
  is_public: boolean;
  goal_tags: GoalTag[];
  ingredients: Array<{ name: string; qty: string; unit: Unit }>;
  instructions: Array<{ step_number: number; text: string }>;
};
