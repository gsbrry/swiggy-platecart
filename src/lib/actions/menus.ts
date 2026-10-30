"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/actions/result";
import { createClient, getUserId } from "@/lib/supabase/server";
import { zDate, zLongText, zUuid, zVisibility } from "@/lib/validation";

const zSlug = z.string().regex(/^[a-z0-9]{6,20}$/);

export async function getMenu(input: { slug: string; start: string; mode: string }): Promise<ActionResult<number>> {
  const parsed = z.object({ slug: zSlug, start: zDate, mode: z.enum(["fill_empty", "overwrite"]) }).safeParse(input);
  if (!parsed.success) return fail("Pick a start date.");
  if (!(await getUserId())) return fail("Please sign in to use this menu.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_menu", { p_slug: parsed.data.slug, p_start: parsed.data.start, p_mode: parsed.data.mode });
  if (error) return fail(error);
  revalidatePath("/plan");
  revalidatePath(`/m/${parsed.data.slug}`);
  return ok(data ?? 0);
}

export async function rateMenu(input: { menuId: string; slug: string; stars: number; review: string }): Promise<ActionResult> {
  const parsed = z
    .object({ menuId: zUuid, slug: zSlug, stars: z.number().int().min(1).max(5), review: zLongText(500) })
    .safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Pick 1 to 5 stars.");
  const userId = await getUserId();
  if (!userId) return fail("Please sign in to rate.");
  const supabase = await createClient();
  const review = parsed.data.review || null;
  const { data: existing } = await supabase
    .from("menu_ratings")
    .select("id")
    .eq("menu_id", parsed.data.menuId)
    .eq("user_id", userId)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("menu_ratings").update({ stars: parsed.data.stars, review }).eq("id", existing.id)
    : await supabase.from("menu_ratings").insert({ menu_id: parsed.data.menuId, user_id: userId, stars: parsed.data.stars, review });
  if (error) {
    if (error.code === "42501") return fail("Use this menu first, then you can rate it.");
    return fail(error);
  }
  revalidatePath(`/m/${parsed.data.slug}`);
  revalidatePath("/market");
  return ok(undefined);
}

export async function setMenuVisibility(input: { menuId: string; slug: string; visibility: string }): Promise<ActionResult> {
  const parsed = z.object({ menuId: zUuid, slug: zSlug, visibility: zVisibility }).safeParse(input);
  if (!parsed.success) return fail("Invalid choice.");
  const userId = await getUserId();
  if (!userId) return fail("Please sign in again.");
  const supabase = await createClient();
  const { error } = await supabase.from("menus").update({ visibility: parsed.data.visibility }).eq("id", parsed.data.menuId).eq("owner_id", userId);
  if (error) return fail(error);
  revalidatePath(`/m/${parsed.data.slug}`);
  revalidatePath("/market");
  revalidatePath("/me");
  return ok(undefined);
}

export async function deleteMenu(form: FormData): Promise<void> {
  const id = zUuid.safeParse(form.get("id"));
  const userId = await getUserId();
  if (!id.success || !userId) redirect("/me");
  const supabase = await createClient();
  await supabase.from("menus").delete().eq("id", id.data).eq("owner_id", userId);
  revalidatePath("/market");
  revalidatePath("/me");
  redirect("/me?deleted=menu");
}
