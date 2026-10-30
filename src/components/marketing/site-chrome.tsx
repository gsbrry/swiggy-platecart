import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { AuthLink } from "@/components/auth/auth-link";

const NAV = [
  { href: "/market", label: "Menus" },
  { href: "/dishes", label: "Dishes" },
  { href: "/creators", label: "For cooks" },
  { href: "/about", label: "About" },
];

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="glass-strong sticky top-0 z-30 border-b border-hairline">
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-app items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Planetto home">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="inline-flex min-h-[44px] items-center px-3 text-[15px] font-medium text-ink-muted hover:text-ink">
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link href="/today" className="btn-primary btn-sm">Go to my dashboard</Link>
          ) : (
            <>
              <AuthLink to="/sign-in" className="btn-ghost btn-sm">Sign in</AuthLink>
              <AuthLink to="/sign-up" className="btn-primary btn-sm">Start free</AuthLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

const FOOTER = [
  { title: "Product", links: [["Plan your week", "/sign-up"], ["Menu market", "/market"], ["Dish library", "/dishes"]] },
  { title: "Planetto", links: [["About", "/about"], ["For home cooks", "/creators"], ["Questions", "/#faq"]] },
  { title: "Legal", links: [["Privacy", "/privacy"], ["Terms and community rules", "/terms"]] },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-white/50">
      <div className="mx-auto grid max-w-app gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm text-ink-muted">A free weekly meal planner for Indian homes. Plan once, cook calmly, share what works.</p>
        </div>
        {FOOTER.map((col) => (
          <div key={col.title}>
            <h2 className="text-sm font-semibold">{col.title}</h2>
            <ul className="mt-3 space-y-2">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-ink-muted hover:text-ink">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-app border-t border-hairline px-4 py-5 text-sm text-ink-muted sm:px-6">
        © {new Date().getFullYear()} Planetto · Made in India
      </div>
    </footer>
  );
}
