import { redirect } from "next/navigation";

import { PlanBoard } from "@/components/plan/plan-board";
import type { DishOption, PlanSlot } from "@/components/plan/types";
import { getMe } from "@/lib/auth";
import { addDays, isIsoDate, todayIso, weekDates, weekStartOf } from "@/lib/dates";
import type { Diet, Meal } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Plan" };

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ w?: string; added?: string }> }) {
  const me = await getMe();
  if (!me) redirect("/sign-in?next=/plan");
  if (!me.settings.onboarded) redirect("/onboarding");

  const { w, added } = await searchParams;
  const today = todayIso();
  const monday = weekStartOf(isIsoDate(w) ? w : today, me.settings.week_start);
  const days = weekDates(monday);

  const supabase = await createClient();
  const [{ data: slots }, { data: dishes }] = await Promise.all([
    supabase
      .from("plan_slots")
      .select("date, meal, is_eatout, dish:dishes(id, name, diet, cook_minutes)")
      .eq("user_id", me.id)
      .gte("date", days[0])
      .lte("date", days[6]),
    supabase
      .from("dishes")
      .select("id, name, diet, meal_types, cook_minutes, owner_id")
      .or(`owner_id.eq.${me.id},and(owner_id.is.null,is_public.eq.true)`)
      .eq("status", "active")
      .order("name")
      .limit(500),
  ]);

  const planSlots: PlanSlot[] = (slots ?? []).map((s) => ({
    date: s.date,
    meal: s.meal as Meal,
    isEatout: s.is_eatout,
    dish: s.dish ? { ...s.dish, diet: s.dish.diet as Diet } : null,
  }));
  const options: DishOption[] = (dishes ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    diet: d.diet as Diet,
    meal_types: d.meal_types as Meal[],
    cook_minutes: d.cook_minutes,
    mine: d.owner_id === me.id,
  }));

  return (
    <PlanBoard
      monday={monday}
      today={today}
      prevWeek={addDays(monday, -7)}
      nextWeek={addDays(monday, 7)}
      slots={planSlots}
      dishes={options}
      diet={me.settings.diet ?? "veg"}
      prefs={{
        exclusions: me.settings.exclusions,
        weekdayMaxMinutes: me.settings.weekday_max_minutes,
        defaultVisibility: me.settings.default_visibility,
      }}
      added={added && /^\d{1,3}$/.test(added) ? Number(added) : null}
    />
  );
}
