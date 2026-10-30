"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown, LayoutList, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";

type Props = { name: string; username: string | null; avatarUrl: string | null; isAdmin: boolean };

/** Avatar button that opens the account menu (profile, menus, dishes, settings, moderation, sign out). */
export function UserMenu({ name, username, avatarUrl, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    { href: "/me", label: "My profile", icon: UserRound },
    { href: "/me#menus", label: "My menus", icon: LayoutList },
    { href: "/dishes?tab=mine", label: "My dishes", icon: BookOpen },
    { href: "/me/settings", label: "Settings", icon: Settings },
    ...(isAdmin ? [{ href: "/admin", label: "Moderation", icon: ShieldCheck }] : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange"
      >
        <Avatar name={name} url={avatarUrl} size={36} />
        <ChevronDown aria-hidden className={`hidden h-4 w-4 text-ink-muted transition sm:block ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="glass-overlay absolute right-0 top-[calc(100%+8px)] z-40 w-64 overflow-hidden rounded-2xl py-2">
          <div className="flex items-center gap-3 border-b border-hairline px-4 pb-3 pt-1">
            <Avatar name={name} url={avatarUrl} size={44} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{name}</p>
              {username && <p className="truncate text-sm text-ink-muted">@{username}</p>}
            </div>
          </div>
          <ul className="py-1">
            {items.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link role="menuitem" href={href} className="flex min-h-[44px] items-center gap-3 px-4 text-[15px] hover:bg-fill-subtle focus-visible:bg-fill-subtle focus-visible:outline-none">
                  <Icon aria-hidden className="h-4 w-4 text-ink-muted" /> {label}
                </Link>
              </li>
            ))}
          </ul>
          <form action="/auth/sign-out" method="post" className="border-t border-hairline pt-1">
            <button role="menuitem" className="flex min-h-[44px] w-full items-center gap-3 px-4 text-[15px] text-danger hover:bg-danger/5">
              <LogOut aria-hidden className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
