import Link from "next/link";

import { GoogleButton, SignInForm } from "@/components/auth/auth-forms";
import { safeNext } from "@/lib/safe-next";

export const metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  link: "That link has expired or was already used. Please sign in, or request a new link.",
  google: "Google sign-in isn't available right now. Please use email.",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const error = sp.error ? ERRORS[sp.error] : undefined;
  return (
    <>
      <h1 className="text-[28px] font-semibold leading-tight">Welcome back</h1>
      <p className="mt-1 text-ink-muted">Sign in to see this week&apos;s plan.</p>
      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-6 space-y-4">
        <GoogleButton next={next} />
        <Divider />
        <SignInForm next={next} />
      </div>
      <p className="mt-6 text-center text-sm text-ink-muted">
        New here?{" "}
        <Link href="/sign-up" className="font-semibold text-ink-orange hover:underline">
          Create a free account
        </Link>
      </p>
    </>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-ink-faint">
      <span className="h-px flex-1 bg-hairline" />
      or with email
      <span className="h-px flex-1 bg-hairline" />
    </div>
  );
}
