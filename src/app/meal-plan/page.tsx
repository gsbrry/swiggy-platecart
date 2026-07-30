import { and, eq, gte } from "drizzle-orm";

import { AppNav } from "@/components/app-nav";
import { MealPlanBoard } from "@/components/meal-plan/meal-plan-board";
import type { PickerTemplate, SlotView } from "@/components/meal-plan/types";
import { db } from "@/db";
import { mealPlans } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { isMockMode, mockBudget, mockSlots } from "@/lib/mock";

export const dynamic = "force-dynamic";

type MealType = "breakfast" | "lunch" | "dinner";

/** Monday of current week (UTC, ISO date). */
function currentWeekStartUTC(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = (day + 6) % 7;
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff),
  );
}

function todayDayOfWeek(): number {
  const day = new Date().getUTCDay();
  return day === 0 ? 7 : day;
}

/** Canned template picker list — mock mode. Mirrors the HTML mockup. */
const PICKER_TEMPLATES: PickerTemplate[] = [
  {
    id: "t-oats",
    dishName: "Oats & Fruit Porridge",
    tags: ["Veg", "High-fibre"],
    avgKcal: 310,
    prepMinutes: 8,
    forks: 847,
    filters: ["veg"],
  },
  {
    id: "t-salad",
    dishName: "Mixed Veggie Salad",
    tags: ["Veg", "Light"],
    avgKcal: 240,
    prepMinutes: 15,
    forks: 623,
    filters: ["veg", "light"],
  },
  {
    id: "t-khichdi",
    dishName: "Dal Khichdi",
    tags: ["Veg", "Protein"],
    avgKcal: 380,
    prepMinutes: 20,
    forks: 1204,
    filters: ["veg", "highprot"],
  },
  {
    id: "t-upma",
    dishName: "Upma with Veggies",
    tags: ["Veg", "South Indian"],
    avgKcal: 280,
    prepMinutes: 12,
    forks: 445,
    filters: ["veg"],
  },
  {
    id: "t-tofu",
    dishName: "Grilled Tofu Bowl",
    tags: ["Veg", "High Protein"],
    avgKcal: 350,
    prepMinutes: 18,
    forks: 312,
    filters: ["veg", "highprot"],
  },
  {
    id: "t-smoothie",
    dishName: "Banana Smoothie Bowl",
    tags: ["Veg", "Quick"],
    avgKcal: 290,
    prepMinutes: 5,
    forks: 567,
    filters: ["veg", "quick"],
  },
  {
    id: "t-poha",
    dishName: "Poha with Peanuts",
    tags: ["Veg", "Quick"],
    avgKcal: 260,
    prepMinutes: 10,
    forks: 389,
    filters: ["veg", "quick"],
  },
  {
    id: "t-moong",
    dishName: "Moong Dal Soup",
    tags: ["Veg", "Light", "Protein"],
    avgKcal: 200,
    prepMinutes: 25,
    forks: 521,
    filters: ["veg", "light", "highprot"],
  },
];

export default async function MealPlanPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--sw-page)]">
        <div className="mx-auto max-w-[1100px] px-6 py-10 text-sm text-[var(--sw-muted)]">
          Please sign in to see your meal plan.
        </div>
      </div>
    );
  }

  const weekStart = currentWeekStartUTC();
  const weekStartIso = weekStart.toISOString().slice(0, 10);
  const today = todayDayOfWeek();
  const mock = isMockMode();

  const planRow = mock
    ? { slots: mockSlots() }
    : await db.query.mealPlans
        .findFirst({
          where: and(
            eq(mealPlans.userId, user.id),
            gte(mealPlans.weekStart, weekStartIso),
          ),
          with: { slots: { with: { template: true } } },
        })
        .catch(() => null);

  const rawSlots = planRow?.slots ?? [];
  const slots: SlotView[] = rawSlots.map((s) => ({
    id: s.id,
    dayOfWeek: s.dayOfWeek,
    mealType: s.mealType as MealType,
    isEatout: s.isEatout,
    templateId: s.templateId,
    template: s.template
      ? {
          id: s.template.id,
          dishName: s.template.dishName,
          tags: s.template.tags,
        }
      : null,
  }));

  const spentGroceries = mock ? mockBudget.spentGroceries : 0;
  const spentEatout = mock ? mockBudget.spentEatout : 0;
  const totalSpent = spentGroceries + spentEatout;
  const monthlyBudget = user.monthlyBudget ? Number(user.monthlyBudget) : 0;

  return (
    <div className="min-h-screen bg-[var(--sw-page)]">
      <AppNav
        avatarInitials={(user.name ?? "U").slice(0, 2).toUpperCase()}
        spent={totalSpent}
        budget={monthlyBudget}
      />
      <MealPlanBoard
        initialSlots={slots}
        weekStartIso={weekStartIso}
        today={today}
        pickerTemplates={PICKER_TEMPLATES}
      />
    </div>
  );
}
