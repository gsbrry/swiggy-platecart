"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2, Mail, Phone } from "lucide-react";

type Method = "email" | "phone";

/**
 * Fake sign-in form for mock mode. Any credentials work — we just navigate
 * to /dashboard. Swaps for real Clerk <SignIn/> when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set.
 */
export function MockSignInForm() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("email");
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    // Small delay so it feels like an auth call.
    setTimeout(() => router.push("/dashboard"), 400);
  }

  return (
    <div className="w-full max-w-[400px] rounded-2xl border border-[var(--sw-border)] bg-white p-8 shadow-sm">
      <h1 className="text-[22px] font-bold tracking-tight text-[var(--sw-charcoal)]">
        Welcome back
      </h1>
      <p className="mt-1 text-[13px] text-[var(--sw-muted)]">
        Sign in to see this week&apos;s plan and cart.
      </p>

      <div
        role="tablist"
        aria-label="Sign-in method"
        className="mt-6 flex gap-1 rounded-lg bg-[var(--sw-page)] p-1"
      >
        <MethodTab active={method === "email"} onClick={() => setMethod("email")}>
          <Mail className="h-3.5 w-3.5" /> Email
        </MethodTab>
        <MethodTab active={method === "phone"} onClick={() => setMethod("phone")}>
          <Phone className="h-3.5 w-3.5" /> Phone
        </MethodTab>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        {method === "email" ? (
          <>
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
              placeholder="••••••••"
              defaultValue="demo1234"
              autoComplete="current-password"
              required
            />
          </>
        ) : (
          <>
            <Field
              label="Phone"
              type="tel"
              name="phone"
              placeholder="+91 90000 00000"
              defaultValue="+91 90000 00000"
              autoComplete="tel"
              required
            />
            <p className="text-[12px] text-[var(--sw-muted)]">
              We&apos;ll text a one-time code. (In demo mode, we skip it.)
            </p>
          </>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--sw-orange)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Continue to dashboard <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-5 rounded-lg border border-dashed border-[var(--sw-border)] bg-[var(--sw-page)] px-3 py-2 text-[11px] leading-relaxed text-[var(--sw-muted)]">
        <b className="font-bold text-[var(--sw-charcoal)]">Demo mode.</b> Any
        credentials will work — we bypass auth and land you on the dashboard.
        Set <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> in{" "}
        <code>.env.local</code> to enable real sign-in.
      </p>

      <p className="mt-4 text-center text-[12px] text-[var(--sw-muted)]">
        New to PlateCart?{" "}
        <Link href="/sign-up" className="font-semibold text-[var(--sw-orange)]">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function MethodTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
        active
          ? "bg-white text-[var(--sw-charcoal)] shadow-sm"
          : "text-[var(--sw-muted)] hover:text-[var(--sw-charcoal)]"
      }`}
    >
      {children}
    </button>
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
