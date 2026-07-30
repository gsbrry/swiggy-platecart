export type TemplateLane = "foryou" | "popular" | "quick" | "protein";

export type TemplateDifficulty = "easy" | "medium" | "hard";

export type TemplateMealType = "breakfast" | "lunch" | "dinner";

export type BrowserTemplate = {
  id: string;
  dishName: string;
  tags: string[];
  kcal: number;
  prepMinutes: number;
  forkCount: number;
  difficulty: TemplateDifficulty;
  mealType: TemplateMealType;
  lane: TemplateLane[];
  /** Filter keys the card matches: "veg", "highprot", "quick", "light", "loss". */
  filters: string[];
};

export type TemplateFilterKey =
  | "all"
  | "veg"
  | "highprot"
  | "quick"
  | "light"
  | "loss";
