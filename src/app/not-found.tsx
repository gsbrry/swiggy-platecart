import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo />
      <h1 className="text-[28px] font-semibold">This page isn&apos;t on the menu</h1>
      <p className="text-ink-muted">The link may be private, deleted or mistyped.</p>
      <div className="flex gap-2">
        <Link href="/" className="btn-secondary">Home</Link>
        <Link href="/market" className="btn-primary">Browse menus</Link>
      </div>
    </main>
  );
}
