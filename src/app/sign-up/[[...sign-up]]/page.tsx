import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

import { isMockMode } from "@/lib/mock";

export default function SignUpPage() {
  if (isMockMode()) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-2xl border border-[var(--sw-border)] bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-xl font-bold text-[var(--sw-charcoal)]">Demo mode</h1>
          <p className="mb-6 max-w-sm text-sm text-[var(--sw-muted)]">
            Sign-up is disabled until Clerk keys are set. Jump straight into the demo.
          </p>
          <Link
            href="/"
            className="inline-block rounded-full bg-[var(--sw-orange)] px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Continue as demo user →
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <SignUp />
    </div>
  );
}
