import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { BottomTabs, DesktopNavLinks } from "@/components/shell/nav-links";
import { getMe, initials } from "@/lib/auth";

/** Sticky glass top bar (desktop links) + glass bottom tab bar on phones. */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="glass-strong sticky top-0 z-30 border-b border-hairline">
        <nav aria-label="Primary" className="mx-auto flex h-16 max-w-app items-center justify-between gap-4 px-4 sm:px-6">
          <Link href={me ? "/plan" : "/"} aria-label="Planetto home">
            <Logo />
          </Link>
          <DesktopNavLinks signedIn={!!me} />
          {me ? (
            <Link
              href="/me"
              aria-label="Your profile and settings"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[image:var(--action)] text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange focus-visible:ring-offset-2"
            >
              {initials(me.profile.display_name)}
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/sign-in" className="btn-ghost btn-sm hidden sm:inline-flex">Sign in</Link>
              <Link href="/sign-up" className="btn-primary btn-sm">Start free</Link>
            </div>
          )}
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-app px-4 pb-[calc(64px+env(safe-area-inset-bottom)+24px)] pt-6 sm:px-6 md:pb-16">
        {children}
      </main>
      {me && <BottomTabs />}
    </div>
  );
}
