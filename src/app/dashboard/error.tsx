"use client";

import { useEffect } from "react";

/** Route-level error boundary — friendly retry UI. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("dashboard error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--sw-page)] px-6">
      <div className="max-w-md rounded-lg glass p-8 text-center">
        <div className="mb-3 text-3xl" aria-hidden>
          🙁
        </div>
        <h1 className="mb-2 text-lg font-bold text-[var(--sw-charcoal)]">
          Something went wrong loading your dashboard
        </h1>
        <p className="mb-5 text-sm text-[var(--sw-muted)]">
          The page couldn&apos;t load. Try again — if it keeps failing, refresh or sign back in.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-appetite px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
