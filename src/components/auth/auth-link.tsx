"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Props = { to: "/sign-in" | "/sign-up"; className?: string; children: React.ReactNode; next?: string };

function Inner({ to, className, children, next }: Props) {
  const pathname = usePathname() ?? "/";
  const search = useSearchParams()?.toString();
  // Come back to the page the visitor is on after signing in (never to the auth pages themselves).
  const here = next ?? (pathname.startsWith("/sign-") || pathname === "/" ? "" : pathname + (search ? `?${search}` : ""));
  const href = here ? `${to}?next=${encodeURIComponent(here)}` : to;
  return (
    <Link href={href} className={className} scroll={false}>
      {children}
    </Link>
  );
}

/** Link that opens sign-in / sign-up as a popup over the current page and returns here afterwards. */
export function AuthLink(props: Props) {
  return (
    <Suspense
      fallback={
        <Link href={props.to} className={props.className}>
          {props.children}
        </Link>
      }
    >
      <Inner {...props} />
    </Suspense>
  );
}
