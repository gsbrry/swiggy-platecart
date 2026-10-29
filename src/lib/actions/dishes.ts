"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/actions/result";
import { createClient, getUserId } from "@/lib/supabase/server";
import { zDate, zDiet, zLongText, zMeal, zTags, zText, zUuid } from "@/lib/validation";

const ingredient = z.object({
  name: zText(0, 60),
  quantity: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(z.number().positive("Quantity must be positive").max(99999).nullable()),
  unit: zText(0, 20),
});

const dishSchema = z.object({
  id: zUuid.nullable(),
  name: zText(2, 80),
  description: zLongText(500),
  diet: zDiet,
  meal_types: z.array(zMeal).max(3),
  cook_minutes: z
    .union([z.string(), z.number()])
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(z.number().int().min(1).max(600).nullable()),
  steps: zLongText(4000),
  tags: zTags(6),
  is_public: z.boolean(),
  ingredients: z.array(ingredient).max(40),
});

export type DishInput = z.input<typeof dishSchema>;

export async function saveDish(input: DishInput): Promise<ActionResult<string>> {
  const parsed = dishSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form.");
  if (!(await getUserId())) return fail("Please sign in again.");
  const { id, ingredients, ...dish } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_dish", {
    p_id: id,
    p_dish: dish,
    p_ingredients: ingredients.filter((i) => i.name),
  });
  if (error || !data) return fail(error);
  revalidatePath("/dishes");
  revalidatePath(`/dishes/${data}`);
  revalidatePath("/plan");
  return ok(data);
}

export async function deleteDish(form: FormData): Promise<void> {
  const id = zUuid.safeParse(form.get("id"));
  if (!id.success) redirect("/dishes");
  const userId = await getUserId();
  if (!userId) redirect("/sign-in");
  const supabase = await createClient();
  await supabase.from("dishes").delete().eq("id", id.data).eq("owner_id", userId);
  revalidatePath("/dishes");
  revalidatePath("/plan");
  redirect("/dishes?tab=mine");
}

export async function forkDish(dishId: string): Promise<ActionResult<string>> {
  const id = zUuid.safeParse(dishId);
  if (!id.success) return fail("Invalid dish.");
  if (!(await getUserId())) return fail("Please sign in to save dishes.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fork_dish", { p_dish: id.data });
  if (error || !data) return fail(error);
  revalidatePath("/dishes");
  return ok(data);
}

export async function addDishToPlan(input: { dishId: string; date: string; meal: string }): Promise<ActionResult> {
  const parsed = z.object({ dishId: zUuid, date: zDate, meal: zMeal }).safeParse(input);
  if (!parsed.success) return fail("Pick a day and meal.");
  const userId = await getUserId();
  if (!userId) return fail("Please sign in to plan meals.");
  const supabase = await createClient();
  const { error } = await supabase.from("plan_slots").upsert(
    { user_id: userId, date: parsed.data.date, meal: parsed.data.meal, dish_id: parsed.data.dishId, is_eatout: false, note: null },
    { onConflict: "user_id,date,meal" },
  );
  if (error) return fail(error);
  revalidatePath("/plan");
  return ok(undefined);
}

export async function reportContent(input: { type: string; id: string; reason: string }): Promise<ActionResult> {
  const parsed = z
    .object({ type: z.enum(["menu", "rating", "dish"]), id: zUuid, reason: zText(3, 500) })
    .safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Tell us what's wrong.");
  const userId = await getUserId();
  if (!userId) return fail("Please sign in to report.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: userId, target_type: parsed.data.type, target_id: parsed.data.id, reason: parsed.data.reason });
  if (error && error.code !== "23505") return fail(error);
  return ok(undefined);
}
