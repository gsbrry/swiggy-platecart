import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

import { MockSignUpForm } from "@/components/auth/mock-sign-up-form";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { isMockMode } from "@/lib/mock";

export const metadata = {
  title: "Sign up — PlateCart",
  description: "Create your PlateCart account and plan your first week.",
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[var(--sw-page)]">
      <header className="border-b border-[var(--sw-border)] bg-white">
        <div className="mx-auto flex h-[58px] max-w-[1160px] items-center justify-between px-6">
          <Link
            href="/"
            className="text-[19px] font-bold tracking-tight text-[var(--sw-charcoal)]"
          >
            Plate<em className="not-italic text-[var(--sw-orange)]">Cart</em>
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[var(--sw-muted)] hover:bg-[var(--sw-page)] hover:text-[var(--sw-charcoal)]"
          >
            Have an account? <span className="font-semibold text-[var(--sw-orange)]">Sign in</span>
          </Link>
        </div>
      </header>
      <main className="flex items-center justify-center px-6 py-16">
        {isMockMode() ? <MockSignUpForm /> : <SignUp appearance={clerkAppearance} />}
      </main>
    </div>
  );
}
