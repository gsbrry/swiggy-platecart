"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

/**
 * Fake sign-up form for mock mode. Any inputs work — we navigate to /onboarding
 * so the demo user runs the 5-step preferences flow. Real Clerk <SignUp/> wires
 * in when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set.
 */
export function MockSignUpForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => router.push("/onboarding"), 400);
  }

  return (
    <div className="w-full max-w-[400px] rounded-2xl border border-[var(--sw-border)] bg-white p-8 shadow-sm">
      <h1 className="text-[22px] font-bold tracking-tight text-[var(--sw-charcoal)]">
        Create your account
      </h1>
      <p className="mt-1 text-[13px] text-[var(--sw-muted)]">
        30 seconds, then straight to your first meal plan.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field
          label="Your name"
          type="text"
          name="name"
          placeholder="Raphy"
          defaultValue="Raphy"
          autoComplete="given-name"
          required
        />
        <Field
          label="Email"
          type="email"
          name="email"
          placeholder="you@example.com"
          defaultValue="raphy@example.com"
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          type="password"
          name="password"
          placeholder="Create a password"
          defaultValue="demo1234"
          autoComplete="new-password"
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--sw-orange)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              Create account <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-5 rounded-lg border border-dashed border-[var(--sw-border)] bg-[var(--sw-page)] px-3 py-2 text-[11px] leading-relaxed text-[var(--sw-muted)]">
        <b className="font-bold text-[var(--sw-charcoal)]">Demo mode.</b> Nothing
        is persisted — you&apos;ll land on onboarding as the demo user.
      </p>

      <p className="mt-4 text-center text-[12px] text-[var(--sw-muted)]">
        Already have one?{" "}
        <Link href="/sign-in" className="font-semibold text-[var(--sw-orange)]">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  ...inputProps
}: {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${inputProps.name}`;
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--sw-muted)]">
        {label}
      </span>
      <input
        {...inputProps}
        id={id}
        className="w-full rounded-lg border border-[var(--sw-border)] bg-white px-3 py-2 text-[14px] text-[var(--sw-charcoal)] placeholder:text-[var(--sw-muted)] focus:border-[var(--sw-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--sw-orange)]/20"
      />
    </label>
  );
}
