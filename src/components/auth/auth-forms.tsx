"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  requestPasswordReset,
  signIn,
  signInWithGoogle,
  signUp,
  updatePassword,
  type AuthState,
} from "@/app/(auth)/actions";

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Please wait…" : children}
    </button>
  );
}

function Notice({ state }: { state: AuthState }) {
  if (state?.error)
    return (
      <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
        {state.error}
      </p>
    );
  if (state?.message)
    return (
      <p role="status" className="rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
        {state.message}
      </p>
    );
  return null;
}

export function GoogleButton({ next }: { next: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <button type="submit" className="btn-secondary w-full">
        <svg aria-hidden viewBox="0 0 48 48" className="h-5 w-5">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        Continue with Google
      </button>
    </form>
  );
}

export function SignInForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <Notice state={state} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="label">Password</label>
          <Link href="/forgot-password" className="text-sm font-medium text-ink-orange hover:underline">
            Forgot?
          </Link>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <Submit>Sign in</Submit>
    </form>
  );
}

export function SignUpForm() {
  const [state, action] = useActionState(signUp, undefined);
  if (state?.message) return <Notice state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <Notice state={state} />
      <div>
        <label htmlFor="name" className="label">Your name</label>
        <input id="name" name="name" autoComplete="given-name" required maxLength={60} className="input" />
      </div>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className="input" />
        <p className="mt-1 text-xs text-ink-muted">At least 10 characters.</p>
      </div>
      <label className="flex items-start gap-2.5 text-sm text-ink-muted">
        <input type="checkbox" name="age" className="mt-0.5 h-5 w-5 accent-[var(--ink-orange)]" required />
        <span>
          I am 18 or older and agree to the{" "}
          <Link href="/terms" className="font-medium text-ink-orange underline">Terms</Link> and{" "}
          <Link href="/privacy" className="font-medium text-ink-orange underline">Privacy Policy</Link>.
        </span>
      </label>
      <Submit>Create account</Submit>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <Notice state={state} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <Submit>Send reset link</Submit>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <Notice state={state} />
      <div>
        <label htmlFor="password" className="label">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className="input" />
      </div>
      <Submit>Save password</Submit>
    </form>
  );
}
