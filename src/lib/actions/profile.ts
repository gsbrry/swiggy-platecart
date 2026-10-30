"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/actions/result";
import { env } from "@/lib/env";
import { createClient, getUserId } from "@/lib/supabase/server";
import { zDiet, zLongText, zText } from "@/lib/validation";

const zUsername = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, "3–20 letters, numbers or underscores.");

const zExclusions = z
  .array(z.string())
  .transform((xs) => Array.from(new Set(xs.map((x) => x.toLowerCase().trim().slice(0, 30)).filter(Boolean))).slice(0, 30));

const onboardingSchema = z.object({
  diet: zDiet,
  exclusions: zExclusions,
  household_size: z.coerce.number().int().min(1).max(12),
  username: zUsername,
});

export async function completeOnboarding(input: z.input<typeof onboardingSchema>): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check your answers.");
  const userId = await getUserId();
  if (!userId) return fail("Please sign in again.");
  const supabase = await createClient();

  const { error: uErr } = await supabase.from("profiles").update({ username: parsed.data.username }).eq("id", userId);
  if (uErr) return uErr.code === "23505" ? fail("That username is taken. Try another.") : fail(uErr);

  const { error } = await supabase
    .from("user_settings")
    .update({
      diet: parsed.data.diet,
      exclusions: parsed.data.exclusions,
      household_size: parsed.data.household_size,
      onboarded: true,
    })
    .eq("user_id", userId);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok(undefined);
}

const profileSchema = z.object({
  display_name: zText(1, 60),
  username: zUsername,
  bio: zLongText(280),
});

export async function updateProfile(input: z.input<typeof profileSchema>): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form.");
  const userId = await getUserId();
  if (!userId) return fail("Please sign in again.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, bio: parsed.data.bio || null })
    .eq("id", userId);
  if (error) return error.code === "23505" ? fail("That username is taken. Try another.") : fail(error);
  revalidatePath("/", "layout");
  return ok(undefined);
}

const settingsSchema = z.object({
  diet: zDiet,
  exclusions: zExclusions,
  household_size: z.coerce.number().int().min(1).max(12),
});

export async function updateSettings(input: z.input<typeof settingsSchema>): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form.");
  const userId = await getUserId();
  if (!userId) return fail("Please sign in again.");
  const supabase = await createClient();
  const { error } = await supabase.from("user_settings").update(parsed.data).eq("user_id", userId);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok(undefined);
}

const planningSchema = z.object({
  week_start: z.enum(["mon", "sun"]),
  default_visibility: z.enum(["private", "link", "public"]),
  weekday_max_minutes: z.union([z.literal(""), z.coerce.number().int().min(10).max(240)]).transform((v) => (v === "" ? null : v)),
});

export async function updatePlanning(input: z.input<typeof planningSchema>): Promise<ActionResult> {
  const parsed = planningSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the form.");
  const userId = await getUserId();
  if (!userId) return fail("Please sign in again.");
  const supabase = await createClient();
  const { error } = await supabase.from("user_settings").update(parsed.data).eq("user_id", userId);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok(undefined);
}

/**
 * Save a profile photo. Only two sources are accepted: the user's own folder in our
 * Storage bucket (uploaded from the browser) or the photo their Google account provides.
 */
export async function setAvatar(input: { source: "upload"; url: string } | { source: "google" } | { source: "none" }): Promise<ActionResult<string | null>> {
  const userId = await getUserId();
  if (!userId) return fail("Please sign in again.");
  const supabase = await createClient();

  let url: string | null = null;
  if (input.source === "upload") {
    const prefix = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${userId}/`;
    if (typeof input.url !== "string" || !input.url.startsWith(prefix) || input.url.length > 500 || /\.\.|[?#]/.test(input.url.slice(prefix.length))) {
      return fail("That photo couldn't be used. Please upload it again.");
    }
    url = input.url;
  } else if (input.source === "google") {
    const { data } = await supabase.auth.getUser();
    const meta = data.user?.user_metadata ?? {};
    const candidate = (meta.avatar_url ?? meta.picture) as unknown;
    if (typeof candidate !== "string" || !/^https:\/\/[a-z0-9-]+\.googleusercontent\.com\//.test(candidate)) {
      return fail("No Google photo found. Sign in with Google once, or upload a photo.");
    }
    url = candidate.slice(0, 500);
  }

  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return ok(url);
}

/** Permanently delete the account and everything it owns (cascades in the database). */
export async function deleteAccount(form: FormData): Promise<void> {
  if (form.get("confirm") !== "DELETE") redirect("/me/settings?error=confirm#account");
  const supabase = await createClient();
  const userId = await getUserId();
  if (userId) {
    // Storage files aren't covered by the database cascade; remove uploaded photos first.
    const { data: files } = await supabase.storage.from("avatars").list(userId);
    if (files?.length) await supabase.storage.from("avatars").remove(files.map((f) => `${userId}/${f.name}`));
  }
  const { error } = await supabase.rpc("delete_my_account");
  if (error) redirect("/me/settings?error=delete#account");
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
