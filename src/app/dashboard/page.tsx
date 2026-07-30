import { and, desc, eq, gte, sql } from "drizzle-orm";

import { AppNav } from "@/components/app-nav";
import { BudgetCard } from "@/components/dashboard/budget-card";
import { Hero } from "@/components/dashboard/hero";
import { MealCards } from "@/components/dashboard/meal-cards";
import { StatsCard } from "@/components/dashboard/stats-card";
import { WeekStrip } from "@/components/dashboard/week-strip";
import { db } from "@/db";
import { mealPlans, ordersLog, wasteLog } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import {
  isMockMode,
  mockBudget,
  mockDaysOnPlan,
  mockSlots,
  mockWastePatterns,
} from "@/lib/mock";

// Force dynamic — this page uses Clerk auth + user-scoped data.
export const dynamic = "force-dynamic";

// Meal type used across the dashboard.
type MealType = "breakfast" | "lunch" | "dinner";

type SlotView = {
  id: string;
  dayOfWeek: number;
  mealType: MealType;
  isEatout: boolean;
  templateId: string | null;
  template: {
    id: string;
    dishName: string;
    tags: string[];
  } | null;
};

/** Monday of current week (UTC, ISO date). Mirrors /api/meal-plans/current. */
function currentWeekStartUTC(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
}

/** 1..7 (Mon..Sun) day-of-week for today, matching schema convention. */
function todayDayOfWeek(): number {
  const day = new Date().getUTCDay();
  return day === 0 ? 7 : day;
}

function greeting(name: string | null | undefined): string {
  const hour = new Date().getHours();
  const first = (name ?? "there").split(" ")[0];
  if (hour < 12) return `Good morning, ${first}`;
  if (hour < 17) return `Good afternoon, ${first}`;
  return `Good evening, ${first}`;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    // Middleware normally redirects unauthenticated users; render a graceful placeholder
    // for the edge case where a server render outruns the redirect.
    return (
      <div className="min-h-screen bg-[var(--sw-page)]">
        <div className="mx-auto max-w-[1100px] px-6 py-10 text-sm text-[var(--sw-muted)]">
          Please sign in to see your dashboard.
        </div>
      </div>
    );
  }

  const weekStart = currentWeekStartUTC();
  const weekStartIso = weekStart.toISOString().slice(0, 10);
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const today = todayDayOfWeek();

  const mock = isMockMode();

  // Fire the four independent reads in parallel — or short-circuit to mock data.
  const [planRow, budgetRows, wasteRows, ordersThisMonth] = mock
    ? [
        { slots: mockSlots() },
        [
          { source: "instamart" as const, total: String(mockBudget.spentGroceries) },
          { source: "food" as const, total: String(mockBudget.spentEatout) },
        ],
        mockWastePatterns,
        Array.from({ length: mockDaysOnPlan() }, (_, i) => ({ day: `d-${i}` })),
      ]
    : await Promise.all([
        db.query.mealPlans
          .findFirst({
            where: and(eq(mealPlans.userId, user.id), gte(mealPlans.weekStart, weekStartIso)),
            with: { slots: { with: { template: true } } },
          })
          .catch(() => null),
        db
          .select({
            source: ordersLog.source,
            total: sql<string>`coalesce(sum(${ordersLog.totalAmount}), 0)`,
          })
          .from(ordersLog)
          .where(and(eq(ordersLog.userId, user.id), gte(ordersLog.orderedAt, monthStart)))
          .groupBy(ordersLog.source)
          .catch(() => [] as Array<{ source: "instamart" | "food"; total: string }>),
        db
          .select({
            ingredient_name: wasteLog.ingredientName,
            count: sql<number>`count(*)::int`,
          })
          .from(wasteLog)
          .where(eq(wasteLog.userId, user.id))
          .groupBy(wasteLog.ingredientName)
          .having(gte(sql<number>`count(*)::int`, 2))
          .orderBy(desc(sql<number>`count(*)::int`))
          .catch(() => [] as Array<{ ingredient_name: string; count: number }>),
        db
          .select({
            day: sql<string>`date_trunc('day', ${ordersLog.orderedAt})::date::text`,
          })
          .from(ordersLog)
          .where(and(eq(ordersLog.userId, user.id), gte(ordersLog.orderedAt, monthStart)))
          .catch(() => [] as Array<{ day: string }>),
      ]);

  // ── Derive view models ─────────────────────────────────────────────────
  let spentGroceries = 0;
  let spentEatout = 0;
  for (const r of budgetRows) {
    if (r.source === "instamart") spentGroceries = Number(r.total);
    if (r.source === "food") spentEatout = Number(r.total);
  }
  const monthlyBudget = user.monthlyBudget ? Number(user.monthlyBudget) : 0;
  const totalSpent = spentGroceries + spentEatout;
  const remaining = Math.max(monthlyBudget - totalSpent, 0);
  const pctSpent = monthlyBudget > 0 ? Math.min(100, Math.round((totalSpent / monthlyBudget) * 100)) : 0;

  const daysOnPlan = new Set(ordersThisMonth.map((r) => r.day)).size;
  // TODO(dashboard): wire from API when ready — "saved vs last month" needs prior month rollup.
  const savedVsLastMonth = 0;

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

  const todaysSlots = slots.filter((s) => s.dayOfWeek === today);

  // Which days of the week (1..7) have any completed order / are eat-out days.
  const doneDays = new Set<number>();
  for (let i = 1; i < today; i++) doneDays.add(i);
  const eatoutDays = new Set<number>(
    slots.filter((s) => s.isEatout).map((s) => s.dayOfWeek),
  );

  const eatoutUsedThisWeek = slots.filter((s) => s.isEatout && s.dayOfWeek < today).length;
  const eatoutQuota = user.eatoutPerWeek ?? 3;

  const goalLabel = user.goal
    ? user.goal === "loss"
      ? "Weight Loss Plan"
      : user.goal === "gain"
        ? "Muscle Gain Plan"
        : "Maintenance Plan"
    : "Personalised Plan";

  return (
    <div className="min-h-screen bg-[var(--sw-page)]">
      <AppNav
        avatarInitials={(user.name ?? "U").slice(0, 2).toUpperCase()}
        spent={totalSpent}
        budget={monthlyBudget}
      />
      <div className="mx-auto max-w-[1100px] px-6 pb-10 pt-5">
        <Hero
          greeting={greeting(user.name)}
          goalLabel={goalLabel}
          weekStart={weekStart}
        />

        {/* Today's Meals */}
        <SectionHeader title="Today's Meals" action="Edit plan" href="/meal-plan" />
        <MealCards slots={todaysSlots} weekStartIso={weekStartIso} />

        {/* Week strip */}
        <WeekStrip
          weekStart={weekStart}
          today={today}
          doneDays={Array.from(doneDays)}
          eatoutDays={Array.from(eatoutDays)}
        />

        {/* Bottom row */}
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[280px_1fr]">
          <BudgetCard
            monthlyBudget={monthlyBudget}
            totalSpent={totalSpent}
            pctSpent={pctSpent}
            remaining={remaining}
            eatoutUsed={eatoutUsedThisWeek}
            eatoutQuota={eatoutQuota}
          />
          <StatsCard
            daysOnPlan={daysOnPlan}
            spentGroceries={spentGroceries}
            savedVsLastMonth={savedVsLastMonth}
            wastePatterns={wasteRows.map((w) => ({
              ingredient: w.ingredient_name,
              count: w.count,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  action,
  href,
}: {
  title: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="mb-3 mt-4 flex items-center justify-between">
      <h2 className="text-[15px] font-bold tracking-tight text-[var(--sw-charcoal)]">{title}</h2>
      {action && href && (
        <a
          href={href}
          className="text-xs font-semibold text-[var(--sw-orange)] hover:opacity-80"
        >
          {action} →
        </a>
      )}
    </div>
  );
}
