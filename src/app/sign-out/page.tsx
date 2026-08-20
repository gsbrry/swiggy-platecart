"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

import { clearMockSession } from "@/lib/mock-session";
import { isMockMode } from "@/lib/mock";

/** Dedicated sign-out page — clears session then hard-redirects. */
export default function SignOutPage() {
  if (isMockMode()) {
    return <MockSignOutRedirect />;
  }
  return <ClerkSignOutRedirect />;
}

function MockSignOutRedirect() {
  useEffect(() => {
    clearMockSession();
    window.location.assign("/sign-in");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--sw-page)]">
      <p className="text-sm text-[var(--sw-muted)]">Signing out…</p>
    </div>
  );
}

function ClerkSignOutRedirect() {
  const { signOut, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    void signOut({ redirectUrl: `${window.location.origin}/` }).catch(() => {
      window.location.assign("/");
    });
  }, [isLoaded, signOut]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--sw-page)]">
      <p className="text-sm text-[var(--sw-muted)]">Signing out…</p>
    </div>
  );
}
