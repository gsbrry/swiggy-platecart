import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-app items-center px-4 sm:px-6">
        <Link href="/" aria-label="Planetto home">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:pt-12">
        <div className="glass w-full max-w-[420px] p-6 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
