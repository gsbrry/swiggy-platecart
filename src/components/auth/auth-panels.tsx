import Link from "next/link";

import { GoogleButton, SignInForm, SignUpForm } from "@/components/auth/auth-forms";

const ERRORS: Record<string, string> = {
  link: "That link has expired or was already used. Please sign in, or request a new link.",
  google: "Google sign-in isn't available right now. Please use email.",
};

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-ink-faint">
      <span className="h-px flex-1 bg-hairline" />
      or with email
      <span className="h-px flex-1 bg-hairline" />
    </div>
  );
}

function withNext(path: string, next: string) {
  return next && next !== "/today" ? `${path}?next=${encodeURIComponent(next)}` : path;
}

/** Sign-in content, shared by the full /sign-in page and the popup over the current page. */
export function SignInPanel({ next, error, inModal = false }: { next: string; error?: string; inModal?: boolean }) {
  const message = error ? ERRORS[error] : undefined;
  return (
    <>
      <h1 className="text-[28px] font-semibold leading-tight">Welcome back</h1>
      <p className="mt-1 text-ink-muted">Sign in to see this week&apos;s plan.</p>
      {message && (
        <p role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {message}
        </p>
      )}
      <div className="mt-6 space-y-4">
        <GoogleButton next={next} />
        <Divider />
        <SignInForm next={next} />
      </div>
      <p className="mt-6 text-center text-sm text-ink-muted">
        New here?{" "}
        <Link href={withNext("/sign-up", next)} replace={inModal} className="font-semibold text-ink-orange hover:underline">
          Create a free account
        </Link>
      </p>
    </>
  );
}

export function SignUpPanel({ next, inModal = false }: { next: string; inModal?: boolean }) {
  return (
    <>
      <h1 className="text-[28px] font-semibold leading-tight">Plan your first week</h1>
      <p className="mt-1 text-ink-muted">Free. Takes about two minutes.</p>
      <div className="mt-6 space-y-4">
        <GoogleButton next="/onboarding" />
        <Divider />
        <SignUpForm />
      </div>
      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href={withNext("/sign-in", next)} replace={inModal} className="font-semibold text-ink-orange hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
