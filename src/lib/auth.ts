import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient, getUserId } from "@/lib/supabase/server";

/** Signed-in user id, or redirect to sign-in. Middleware already guards routes; this guards actions. */
export async function requireUserId(next?: string): Promise<string> {
  const id = await getUserId();
  if (!id) redirect(next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in");
  return id;
}

/** Profile + private settings for the current user (null when signed out). Cached per request. */
export const getMe = cache(async () => {
  const id = await getUserId();
  if (!id) return null;
  const supabase = await createClient();
  const [{ data: profile }, { data: settings }, { data: admin }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, bio").eq("id", id).maybeSingle(),
    supabase.from("user_settings").select("diet, exclusions, household_size, onboarded").eq("user_id", id).maybeSingle(),
    supabase.rpc("am_i_admin"),
  ]);
  if (!profile) return null;
  return {
    id,
    profile,
    settings: settings ?? { diet: null, exclusions: [], household_size: 2, onboarded: false },
    isAdmin: admin === true,
  };
});

export type Me = NonNullable<Awaited<ReturnType<typeof getMe>>>;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "P") + (parts[1]?.[0] ?? "")).toUpperCase();
}
