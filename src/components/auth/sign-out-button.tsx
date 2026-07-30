"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  isMock: boolean;
  className?: string;
};

const buttonClass =
  "flex items-center gap-1.5 rounded-lg border-[1.5px] border-[var(--sw-border)] bg-white px-3.5 py-2 text-[13px] font-semibold text-[var(--sw-charcoal)] transition hover:bg-[var(--sw-page)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2";

/** Sign out — mock mode navigates home; real mode clears the Clerk session. */
export function SignOutButton({ isMock, className }: Props) {
  if (isMock) {
    return <MockSignOutButton className={className} />;
  }
  return <ClerkSignOutButton className={className} />;
}

function MockSignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      className={className ?? buttonClass}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}

function ClerkSignOutButton({ className }: { className?: string }) {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      onClick={() => void signOut({ redirectUrl: "/" })}
      className={className ?? buttonClass}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
