import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

import { MockSignInForm } from "@/components/auth/mock-sign-in-form";
import { isMockMode } from "@/lib/mock";

export const metadata = {
  title: "Sign in — PlateCart",
  description: "Sign in to see your dashboard and this week's meal plan.",
};

export default function SignInPage() {
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
            href="/sign-up"
            className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[var(--sw-muted)] hover:bg-[var(--sw-page)] hover:text-[var(--sw-charcoal)]"
          >
            New here? <span className="font-semibold text-[var(--sw-orange)]">Sign up</span>
          </Link>
        </div>
      </header>
      <main className="flex items-center justify-center px-6 py-16">
        {isMockMode() ? <MockSignInForm /> : <SignIn />}
      </main>
    </div>
  );
}
