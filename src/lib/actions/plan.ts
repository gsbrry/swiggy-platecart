"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/actions/result";
import { addDays, weekDates } from "@/lib/dates";
import { PERIOD_DAYS } from "@/lib/labels";
import { createClient, getUserId } from "@/lib/supabase/server";
import { zDate, zDiet, zLongText, zMeal, zPeriod, zTags, zText, zUuid, zVisibility } from "@/lib/validation";

const slotKey = z.object({ date: zDate, meal: zMeal });

async function session() {
  const userId = await getUserId();
  return userId ? { userId, supabase: await createClient() } : null;
}

export async function setSlotDish(input: { date: string; meal: string; dishId: string }): Promise<ActionResult> {
  const parsed = slotKey.extend({ dishId: zUuid }).safeParse(input);
  if (!parsed.success) return fail("Invalid slot.");
  const s = await session();
  if (!s) return fail("Please sign in again.");
  const { error } = await s.supabase.from("plan_slots").upsert(
    { user_id: s.userId, date: parsed.data.date, meal: parsed.data.meal, dish_id: parsed.data.dishId, is_eatout: false, note: null },
    { onConflict: "user_id,date,meal" },
  );
  if (error) return fail(error);
  revalidatePath("/plan");
  return ok(undefined);
}

export async function setSlotEatout(input: { date: string; meal: string }): Promise<ActionResult> {
  const parsed = slotKey.safeParse(input);
  if (!parsed.success) return fail("Invalid slot.");
  const s = await session();
  if (!s) return fail("Please sign in again.");
  const { error } = await s.supabase.from("plan_slots").upsert(
    { user_id: s.userId, date: parsed.data.date, meal: parsed.data.meal, dish_id: null, is_eatout: true },
    { onConflict: "user_id,date,meal" },
  );
  if (error) return fail(error);
  revalidatePath("/plan");
  return ok(undefined);
}

export async function clearSlot(input: { date: string; meal: string }): Promise<ActionResult> {
  const parsed = slotKey.safeParse(input);
  if (!parsed.success) return fail("Invalid slot.");
  const s = await session();
  if (!s) return fail("Please sign in again.");
  const { error } = await s.supabase
    .from("plan_slots")
    .delete()
    .eq("user_id", s.userId)
    .eq("date", parsed.data.date)
    .eq("meal", parsed.data.meal);
  if (error) return fail(error);
  revalidatePath("/plan");
  return ok(undefined);
}

/** Create a private dish from the picker's search text and put it straight into the slot. */
export async function quickAddDish(input: { date: string; meal: string; name: string; diet: string }): Promise<ActionResult> {
  const parsed = slotKey.extend({ name: zText(2, 80), diet: zDiet }).safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid dish.");
  const s = await session();
  if (!s) return fail("Please sign in again.");
  const { data: dish, error } = await s.supabase
    .from("dishes")
    .insert({ owner_id: s.userId, name: parsed.data.name, diet: parsed.data.diet, meal_types: [parsed.data.meal] })
    .select("id")
    .single();
  if (error || !dish) return fail(error);
  return setSlotDish({ date: parsed.data.date, meal: parsed.data.meal, dishId: dish.id });
}

/** Fill this week's empty slots with last week's plan. Never overwrites. */
export async function copyPreviousWeek(input: { monday: string }): Promise<ActionResult<number>> {
  const parsed = z.object({ monday: zDate }).safeParse(input);
  if (!parsed.success) return fail("Invalid week.");
  const s = await session();
  if (!s) return fail("Please sign in again.");
  const thisWeek = weekDates(parsed.data.monday);
  const prevMonday = addDays(parsed.data.monday, -7);

  const [{ data: prev, error: e1 }, { data: current, error: e2 }] = await Promise.all([
    s.supabase.from("plan_slots").select("date, meal, dish_id, is_eatout").eq("user_id", s.userId).gte("date", prevMonday).lt("date", parsed.data.monday),
    s.supabase.from("plan_slots").select("date, meal").eq("user_id", s.userId).gte("date", thisWeek[0]).lte("date", thisWeek[6]),
  ]);
  if (e1 || e2) return fail(e1 ?? e2);
  const taken = new Set((current ?? []).map((r) => `${r.date}|${r.meal}`));
  const rows = (prev ?? [])
    .filter((r) => r.dish_id || r.is_eatout)
    .map((r) => ({ user_id: s.userId, date: addDays(r.date, 7), meal: r.meal, dish_id: r.dish_id, is_eatout: r.is_eatout }))
    .filter((r) => !taken.has(`${r.date}|${r.meal}`));
  if (rows.length === 0) return fail("Last week has nothing to copy into the empty slots.");
  const { error } = await s.supabase.from("plan_slots").insert(rows);
  if (error) return fail(error);
  revalidatePath("/plan");
  return ok(rows.length);
}

const shareSchema = z.object({
  start: zDate,
  period: zPeriod,
  title: zText(3, 80),
  description: zLongText(600),
  visibility: zVisibility,
  diet: zDiet,
  tags: zTags(3),
});

/** Snapshot part of the plan into a Menu (private, link-shared or public in the Market). Returns its slug. */
export async function createMenuFromPlan(input: z.input<typeof shareSchema>): Promise<ActionResult<string>> {
  const parsed = shareSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form.");
  const s = await session();
  if (!s) return fail("Please sign in again.");
  const d = parsed.data;
  if (!(d.period in PERIOD_DAYS)) return fail("Invalid period.");
  const { data: slug, error } = await s.supabase.rpc("create_menu_from_plan", {
    p_start: d.start,
    p_period: d.period,
    p_title: d.title,
    p_description: d.description,
    p_visibility: d.visibility,
    p_diet: d.diet,
    p_tags: d.tags,
  });
  if (error || !slug) return fail(error);
  revalidatePath("/me");
  revalidatePath("/market");
  return ok(slug);
}
