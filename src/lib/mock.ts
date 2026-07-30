/**
 * Mock mode — lets the app run end-to-end with zero external services.
 *
 * Auto-enabled when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing.
 * The moment you drop real Clerk keys into .env.local, mock mode turns off
 * and the real Clerk + Neon paths take over.
 */

export function isMockMode(): boolean {
  return !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

export type MockUser = {
  id: string;
  clerkId: string;
  name: string | null;
  goal: "loss" | "gain" | "maintain" | null;
  dietType: "veg" | "nonveg" | "vegan" | "keto" | "jain" | "glutenfree" | null;
  householdSize: number | null;
  monthlyBudget: string | null;
  eatoutPerWeek: number | null;
  exclusions: string[];
  createdAt: Date;
  updatedAt: Date;
};

export const mockUser: MockUser = {
  id: "00000000-0000-0000-0000-000000000001",
  clerkId: "mock_demo_user",
  name: "Raphy",
  goal: "loss",
  dietType: "veg",
  householdSize: 2,
  monthlyBudget: "12000",
  eatoutPerWeek: 3,
  exclusions: ["onion", "garlic"],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export type MockSlot = {
  id: string;
  dayOfWeek: number;
  mealType: "breakfast" | "lunch" | "dinner";
  isEatout: boolean;
  templateId: string | null;
  template: { id: string; dishName: string; tags: string[] } | null;
};

function todayDow(): number {
  const day = new Date().getUTCDay();
  return day === 0 ? 7 : day;
}

/** A full week (7 days × 3 meals = 21 slots) with realistic gaps and an eat-out. */
export function mockSlots(): MockSlot[] {
  const t = (id: string, dish: string, tags: string[]) => ({ id, dishName: dish, tags });
  const templates = {
    poha: t("t-poha", "Moong-dal Poha", ["breakfast", "quick", "protein"]),
    oats: t("t-oats", "Banana Oats", ["breakfast", "veg", "quick"]),
    khichdi: t("t-khichdi", "Vegetable Khichdi", ["lunch", "veg", "light"]),
    dalRice: t("t-dalrice", "Dal Chawal", ["lunch", "veg", "protein"]),
    paneer: t("t-paneer", "Paneer Bhurji + Roti", ["dinner", "veg", "protein"]),
    veggie: t("t-veggie", "Mixed Veg Curry + Roti", ["dinner", "veg", "light"]),
  };

  const plan: Array<[number, "breakfast" | "lunch" | "dinner", keyof typeof templates | "eatout" | "empty"]> = [
    [1, "breakfast", "poha"], [1, "lunch", "dalRice"], [1, "dinner", "paneer"],
    [2, "breakfast", "oats"], [2, "lunch", "khichdi"], [2, "dinner", "veggie"],
    [3, "breakfast", "poha"], [3, "lunch", "dalRice"], [3, "dinner", "eatout"],
    [4, "breakfast", "oats"], [4, "lunch", "khichdi"], [4, "dinner", "paneer"],
    [5, "breakfast", "poha"], [5, "lunch", "empty"], [5, "dinner", "veggie"],
    [6, "breakfast", "oats"], [6, "lunch", "eatout"], [6, "dinner", "paneer"],
    [7, "breakfast", "empty"], [7, "lunch", "dalRice"], [7, "dinner", "veggie"],
  ];

  return plan.map(([dow, mealType, key], i) => {
    const id = `slot-${i}`;
    if (key === "eatout") {
      return { id, dayOfWeek: dow, mealType, isEatout: true, templateId: null, template: null };
    }
    if (key === "empty") {
      return { id, dayOfWeek: dow, mealType, isEatout: false, templateId: null, template: null };
    }
    const tpl = templates[key];
    return { id, dayOfWeek: dow, mealType, isEatout: false, templateId: tpl.id, template: tpl };
  });
}

export function mockTodaySlots(): MockSlot[] {
  const today = todayDow();
  return mockSlots().filter((s) => s.dayOfWeek === today);
}

/** Month-to-date spend split — mid-cycle so the ring is partially filled. */
export const mockBudget = {
  spentGroceries: 4820,
  spentEatout: 1350,
};

export const mockWastePatterns: Array<{ ingredient_name: string; count: number }> = [
  { ingredient_name: "coriander", count: 3 },
  { ingredient_name: "spinach", count: 2 },
];

/** Days in current month with any order. */
export function mockDaysOnPlan(): number {
  return 11;
}
