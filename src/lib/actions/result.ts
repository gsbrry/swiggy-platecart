import type { PostgrestError } from "@supabase/supabase-js";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

/** Turn a DB error into a message safe to show. Our own RAISEs are user-facing; others are not. */
export function fail(error: PostgrestError | Error | string | null | undefined, fallback = "Something went wrong. Please try again."): ActionResult<never> {
  if (!error) return { ok: false, error: fallback };
  if (typeof error === "string") return { ok: false, error };
  const code = "code" in error ? error.code : undefined;
  if (code === "P0001" || code === "22023") return { ok: false, error: error.message };
  if (code === "P0002") return { ok: false, error: "That item no longer exists." };
  if (code === "23505") return { ok: false, error: "That already exists." };
  if (code === "42501" || code === "28000") return { ok: false, error: "Please sign in again." };
  console.error("[action]", code, error.message);
  return { ok: false, error: fallback };
}
