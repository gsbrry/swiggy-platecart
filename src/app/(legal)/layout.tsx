import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-app items-center px-4 sm:px-6">
        <Link href="/" aria-label="Planetto home"><Logo /></Link>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-20 pt-4">
        <article className="surface-solid space-y-4 p-6 leading-relaxed sm:p-8 [&_h1]:text-[28px] [&_h1]:font-semibold [&_h2]:pt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-ink">
          {children}
        </article>
      </main>
    </div>
  );
}
