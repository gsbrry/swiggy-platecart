import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { BottomTabs, DesktopNavLinks } from "@/components/shell/nav-links";
import { UserMenu } from "@/components/shell/user-menu";
import { getMe } from "@/lib/auth";

/** Sticky glass top bar (desktop links + account menu) and a glass bottom tab bar on phones. */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="glass-strong sticky top-0 z-30 border-b border-hairline">
        <nav aria-label="Primary" className="mx-auto flex h-16 max-w-app items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Planetto home page">
            <Logo />
          </Link>
          <DesktopNavLinks signedIn={!!me} />
          {me ? (
            <UserMenu name={me.profile.display_name} username={me.profile.username} avatarUrl={me.profile.avatar_url} isAdmin={me.isAdmin} />
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
