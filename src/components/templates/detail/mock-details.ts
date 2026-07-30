/**
 * Per-template detail overlays for the Template Detail screen.
 *
 * The base browser catalogue (`MOCK_TEMPLATES`) carries lightweight card fields.
 * This file adds the extra recipe data — ingredients, cook steps, macro
 * breakdown, servings, per-serving cost, creator — that only the detail view
 * needs. Templates without an explicit entry fall back to `SAMPLE_DETAIL`.
 */

export type TemplateIngredient = {
  name: string;
  /** Quantity per single serving. Multiplied live by the serving toggle. */
  qty: number;
  unit: string;
  /** Optional hint shown after the ingredient name (e.g. "chopped fine"). */
  note?: string;
};

export type TemplateStep = {
  text: string;
  tip?: string;
};

export type TemplateDetail = {
  ingredients: TemplateIngredient[];
  steps: TemplateStep[];
  /** Base servings the ingredient quantities are expressed for. */
  baseServings: number;
  /** Estimated cost per serving in ₹. */
  cost: number;
  /** Protein grams per serving. */
  protein: number;
  /** Carbs grams per serving. */
  carbs: number;
  /** Fat grams per serving. */
  fat: number;
  /** Creator display handle. */
  creatorHandle: string;
  /** Creator avatar initials. */
  creatorInitials: string;
  /** Number of Instamart adds this month — social proof. */
  buyCountMonthly: number;
  /** Rendered on the goal-match social-proof line. */
  goalMatch?: string;
};

export const SAMPLE_DETAIL: TemplateDetail = {
  ingredients: [
    { name: "Base grain (rice / oats)", qty: 40, unit: "g" },
    { name: "Vegetables (mixed, chopped)", qty: 80, unit: "g" },
    { name: "Onion", qty: 0.5, unit: "medium" },
    { name: "Tomato", qty: 0.5, unit: "medium" },
    { name: "Cooking oil", qty: 1, unit: "tsp" },
    { name: "Salt & spices", qty: 1, unit: "pinch" },
  ],
  steps: [
    { text: "Prep the base grain — rinse, soak or measure per package." },
    { text: "Chop vegetables into bite-size pieces." },
    { text: "Heat oil, sauté aromatics until fragrant." },
    { text: "Add vegetables and grain, cook covered until tender." },
    { text: "Season, garnish and serve hot." },
  ],
  baseServings: 2,
  cost: 55,
  protein: 12,
  carbs: 40,
  fat: 8,
  creatorHandle: "@platecart",
  creatorInitials: "PC",
  buyCountMonthly: 120,
};

export const MOCK_TEMPLATE_DETAILS: Record<string, TemplateDetail> = {
  "t-khichdi": {
    ingredients: [
      { name: "Rice (basmati or short-grain)", qty: 40, unit: "g" },
      { name: "Moong dal (yellow)", qty: 40, unit: "g" },
      { name: "Ghee", qty: 1, unit: "tsp" },
      { name: "Cumin seeds", qty: 0.5, unit: "tsp" },
      { name: "Onion", qty: 0.5, unit: "medium", note: "finely chopped" },
      { name: "Tomato", qty: 0.5, unit: "medium", note: "chopped" },
      { name: "Turmeric powder", qty: 0.25, unit: "tsp" },
      { name: "Water", qty: 1.5, unit: "cups" },
      { name: "Fresh coriander", qty: 1, unit: "sprig", note: "to garnish" },
    ],
    steps: [
      {
        text: "Rinse moong dal and rice together until water runs clear. Soak for 15 minutes if time allows.",
        tip: "Soaking reduces cook time by 5 min.",
      },
      { text: "Heat ghee in a pressure cooker. Add cumin seeds and let them splutter for 30 seconds." },
      { text: "Add chopped onion and tomato. Cook on medium heat for 3–4 minutes until softened. Add turmeric and salt." },
      {
        text: "Add rinsed dal and rice. Add 3 cups water. Pressure cook for 3–4 whistles on medium heat.",
        tip: "Let pressure release naturally for 5 min.",
      },
      { text: "Open, adjust consistency with water if needed. Garnish with fresh coriander. Serve hot." },
    ],
    baseServings: 2,
    cost: 68,
    protein: 28,
    carbs: 45,
    fat: 8,
    creatorHandle: "@priya_eats",
    creatorInitials: "PR",
    buyCountMonthly: 847,
    goalMatch: "Weight Loss",
  },

  "t-oats": {
    ingredients: [
      { name: "Rolled oats", qty: 40, unit: "g" },
      { name: "Milk (or plant milk)", qty: 180, unit: "ml" },
      { name: "Banana", qty: 0.5, unit: "medium", note: "sliced" },
      { name: "Mixed berries", qty: 30, unit: "g" },
      { name: "Chia seeds", qty: 1, unit: "tsp" },
      { name: "Honey", qty: 1, unit: "tsp", note: "optional" },
      { name: "Cinnamon", qty: 1, unit: "pinch" },
    ],
    steps: [
      { text: "Combine oats and milk in a small saucepan. Bring to a gentle simmer over medium heat." },
      {
        text: "Cook, stirring often, for 4–5 minutes until oats are creamy and thick.",
        tip: "Add a splash more milk if it looks dry.",
      },
      { text: "Stir in chia seeds and cinnamon. Remove from heat and rest for 1 minute." },
      { text: "Transfer to a bowl. Top with banana slices, berries and a drizzle of honey. Serve warm." },
    ],
    baseServings: 1,
    cost: 45,
    protein: 12,
    carbs: 52,
    fat: 6,
    creatorHandle: "@morning_bowl",
    creatorInitials: "MB",
    buyCountMonthly: 612,
    goalMatch: "High Fibre",
  },

  "t-salad": {
    ingredients: [
      { name: "Cucumber", qty: 0.5, unit: "medium", note: "diced" },
      { name: "Cherry tomatoes", qty: 60, unit: "g", note: "halved" },
      { name: "Carrot", qty: 0.5, unit: "medium", note: "grated" },
      { name: "Bell pepper", qty: 0.25, unit: "medium", note: "sliced" },
      { name: "Sprouts (moong)", qty: 30, unit: "g" },
      { name: "Olive oil", qty: 1, unit: "tsp" },
      { name: "Lemon juice", qty: 1, unit: "tsp" },
      { name: "Salt & pepper", qty: 1, unit: "pinch" },
    ],
    steps: [
      { text: "Wash all vegetables thoroughly. Pat dry before chopping." },
      { text: "Combine cucumber, tomato, carrot and bell pepper in a large bowl." },
      { text: "Add sprouts and toss gently to distribute." },
      {
        text: "Whisk olive oil, lemon juice, salt and pepper. Drizzle over the salad and toss.",
        tip: "Dress just before serving to keep it crisp.",
      },
      { text: "Serve immediately." },
    ],
    baseServings: 1,
    cost: 52,
    protein: 8,
    carbs: 22,
    fat: 6,
    creatorHandle: "@crunch_club",
    creatorInitials: "CC",
    buyCountMonthly: 421,
    goalMatch: "Weight Loss",
  },

  "t-poha": {
    ingredients: [
      { name: "Poha (flattened rice, thick)", qty: 50, unit: "g" },
      { name: "Peanuts, raw", qty: 15, unit: "g" },
      { name: "Onion", qty: 0.5, unit: "medium", note: "chopped" },
      { name: "Green chilli", qty: 0.5, unit: "piece" },
      { name: "Mustard seeds", qty: 0.5, unit: "tsp" },
      { name: "Curry leaves", qty: 4, unit: "leaves" },
      { name: "Turmeric powder", qty: 0.25, unit: "tsp" },
      { name: "Oil", qty: 1, unit: "tsp" },
      { name: "Lemon", qty: 0.25, unit: "piece" },
      { name: "Fresh coriander", qty: 1, unit: "sprig" },
    ],
    steps: [
      { text: "Rinse poha in a colander under cool water for 10 seconds. Drain and fluff with a fork." },
      { text: "Heat oil, add mustard seeds. Once they splutter, add peanuts and toast until golden." },
      { text: "Add curry leaves, green chilli and onion. Sauté 2 minutes until onion turns translucent." },
      {
        text: "Add turmeric, salt and drained poha. Toss gently to coat.",
        tip: "Fold rather than stir — poha is delicate.",
      },
      { text: "Cover and steam on low for 2 minutes. Finish with lemon juice and coriander. Serve hot." },
    ],
    baseServings: 1,
    cost: 38,
    protein: 8,
    carbs: 42,
    fat: 7,
    creatorHandle: "@breakfast_bhai",
    creatorInitials: "BB",
    buyCountMonthly: 289,
    goalMatch: "Quick Prep",
  },
};

/**
 * Look up detail for a template, falling back to a canned sample.
 * The detail view always renders — never a "coming soon" — because the
 * mockup depends on real numbers and quantities.
 */
export function getTemplateDetail(id: string): TemplateDetail {
  return MOCK_TEMPLATE_DETAILS[id] ?? SAMPLE_DETAIL;
}
