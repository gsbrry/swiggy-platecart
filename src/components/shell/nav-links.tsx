"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, ShoppingBasket, Store, Sun, UserRound } from "lucide-react";

const DESKTOP = [
  { href: "/today", label: "Today", public: false },
  { href: "/plan", label: "Plan", public: false },
  { href: "/dishes", label: "Dishes", public: true },
  { href: "/market", label: "Market", public: true },
  { href: "/list", label: "List", public: false },
] as const;

// Five tabs fit a 390px phone; Dishes is reached from Plan's picker and the account menu.
const MOBILE = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/plan", label: "Plan", icon: CalendarDays },
  { href: "/market", label: "Market", icon: Store },
  { href: "/list", label: "List", icon: ShoppingBasket },
  { href: "/me", label: "Me", icon: UserRound },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/market") return pathname.startsWith("/market") || pathname.startsWith("/m/");
  if (href === "/me") return pathname.startsWith("/me") || pathname.startsWith("/dishes");
  return pathname === href || pathname.startsWith(href + "/");
}

export function DesktopNavLinks({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname() ?? "";
  return (
    <ul className="hidden items-center gap-1 md:flex">
      {DESKTOP.filter((t) => signedIn || t.public).map((t) => {
        const active = isActive(pathname, t.href);
        return (
          <li key={t.href}>
            <Link
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`relative inline-flex min-h-[44px] items-center px-3 text-[15px] font-medium transition ${
                active ? "text-ink-orange" : "text-ink-muted hover:text-ink"
              }`}
            >
              {t.label}
              {active && <span className="absolute inset-x-3 bottom-1.5 h-0.5 rounded-full bg-[var(--ink-orange)]" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function BottomTabs() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      aria-label="Main"
      className="glass-strong fixed inset-x-0 bottom-0 z-30 border-t border-hairline pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
        {MOBILE.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                  active ? "text-ink-orange" : "text-ink-muted"
                }`}
              >
                {active && <span className="absolute top-1 h-1 w-1 rounded-full bg-[var(--ink-orange)]" />}
                <Icon aria-hidden className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
