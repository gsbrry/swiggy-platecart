"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

import { clearMockSession, establishMockSession } from "@/lib/mock-session";
import { isMockMode } from "@/lib/mock";

type Props = {
  className?: string;
};

const buttonClass =
  "flex items-center gap-1.5 rounded-lg border-[1.5px] border-[var(--sw-border)] bg-white px-3.5 py-2 text-[13px] font-semibold text-[var(--sw-charcoal)] transition hover:bg-[var(--sw-page)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

/** Sign out — mock mode sets a cookie + redirects; real mode hits /sign-out. */
export function SignOutButton({ className }: Props) {
  const [busy, setBusy] = useState(false);
  const mock = isMockMode();

  const handleClick = () => {
    if (busy) return;
    setBusy(true);

    if (mock) {
      clearMockSession();
      window.location.assign("/sign-in");
      return;
    }

    window.location.assign("/sign-out");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={className ?? buttonClass}
    >
      <LogOut className="h-4 w-4" />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}

/** Call when mock sign-in succeeds so protected routes work again. */
export { establishMockSession };
