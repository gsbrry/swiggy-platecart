"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { safeNext } from "@/lib/safe-next";
import { siteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string } | undefined;

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
const password = z.string().min(10, "Use at least 10 characters.").max(72, "Use at most 72 characters.");

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Email or password is wrong.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first. Check your inbox for the link.";
  if (/already registered|already exists/i.test(message)) return "An account with this email already exists. Try signing in.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Please wait a few minutes and try again.";
  if (/pwned|leaked|weak/i.test(message)) return "This password has appeared in a data breach. Please choose another.";
  return "Something went wrong. Please try again.";
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password.") }).safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: friendly(error.message) };
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z
    .object({
      name: z.string().trim().min(1, "Tell us your name.").max(60),
      email,
      password,
      age: z.literal("on", { message: "You must be 18 or older to use Planetto." }),
    })
    .safeParse({ name: form.get("name"), email: form.get("email"), password: form.get("password"), age: form.get("age") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const origin = await siteUrl();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });
  if (error) return { error: friendly(error.message) };
  // With email confirmation on there is no session yet; Supabase also returns no error for
  // an existing email (to avoid leaking accounts), so the message stays neutral.
  if (!data.session) {
    return { message: `We've sent a confirmation link to ${parsed.data.email}. Open it on this device to continue.` };
  }
  redirect("/onboarding");
}

export async function signInWithGoogle(form: FormData): Promise<void> {
  const supabase = await createClient();
  const origin = await siteUrl();
  const next = safeNext(form.get("next"));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect(`/sign-in?error=google`);
  redirect(data.url);
}

export async function requestPasswordReset(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const origin = await siteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error && /rate limit|too many/i.test(error.message)) return { error: friendly(error.message) };
  return { message: "If an account exists for that email, a reset link is on its way." };
}

export async function updatePassword(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = password.safeParse(form.get("password"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: friendly(error.message) };
  redirect("/plan");
}
