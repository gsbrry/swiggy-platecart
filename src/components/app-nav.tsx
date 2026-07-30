"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

type Props = {
  avatarInitials: string;
  spent: number;
  budget: number;
};

const TABS = [
  { href: "/", label: "Dashboard" },
  { href: "/meal-plan", label: "Meal Plan" },
  { href: "/templates", label: "Templates" },
  { href: "/budget", label: "Budget" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/** Sticky top nav — logo, section links, budget pill, notifications, avatar. */
export function AppNav({ avatarInitials, spent, budget }: Props) {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="sticky top-0 z-20 border-b border-[var(--sw-border)] bg-white">
      <div className="mx-auto flex h-[58px] max-w-[1100px] items-center justify-between px-6">
        <Link
          href="/"
          className="text-[19px] font-bold tracking-tight text-[var(--sw-charcoal)]"
        >
          Plate<em className="not-italic text-[var(--sw-orange)]">Cart</em>
        </Link>
        <div className="hidden gap-0.5 md:flex">
          {TABS.map((t) => (
            <NavLink key={t.href} href={t.href} active={isActive(pathname, t.href)}>
              {t.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-full border border-[var(--sw-border)] bg-[var(--sw-page)] px-3 py-1 text-xs sm:flex">
            <b className="font-bold text-[var(--sw-charcoal)]">
              ₹{spent.toLocaleString("en-IN")}
            </b>
            <span className="text-[var(--sw-muted)]">
              / ₹{budget.toLocaleString("en-IN")}
            </span>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[var(--sw-border)] bg-[var(--sw-page)] text-[var(--sw-charcoal)]"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full border-[1.5px] border-white bg-[var(--sw-orange)]" />
          </button>
          <Link
            href="/settings"
            aria-label="Account settings"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[var(--sw-orange)] text-xs font-bold text-white"
          >
            {avatarInitials}
          </Link>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  children,
  href,
  active,
}: {
  children: React.ReactNode;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? "font-semibold text-[var(--sw-orange)]"
          : "text-[var(--sw-muted)] hover:bg-[var(--sw-page)] hover:text-[var(--sw-charcoal)]"
      }`}
    >
      {children}
    </Link>
  );
}
