import Link from "next/link";

import { GoogleButton, SignUpForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-[28px] font-semibold leading-tight">Plan your first week</h1>
      <p className="mt-1 text-ink-muted">Free. Takes about two minutes.</p>
      <div className="mt-6 space-y-4">
        <GoogleButton next="/onboarding" />
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-ink-faint">
          <span className="h-px flex-1 bg-hairline" />
          or with email
          <span className="h-px flex-1 bg-hairline" />
        </div>
        <SignUpForm />
      </div>
      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-ink-orange hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
