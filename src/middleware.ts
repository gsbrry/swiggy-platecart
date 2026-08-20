import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { isMockMode } from "@/lib/mock";
import { MOCK_SIGNED_OUT_COOKIE } from "@/lib/mock-session";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sign-out",
  "/api/auth/webhook",
]);

/**
 * Content Security Policy — kept in one place so the Vercel review team can tune.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https://img.clerk.com https://*.clerk.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://*.neon.tech",
  "frame-src https://*.clerk.com https://*.clerk.accounts.dev",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "microphone=(self)",
  "Content-Security-Policy": CSP,
};

function withSecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

const clerkAware = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth().protect();
  }
  return withSecurityHeaders(NextResponse.next());
});

/**
 * Mock mode short-circuits Clerk entirely so the app boots with zero setup.
 * Real Clerk kicks in the moment NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set.
 */
export default function middleware(req: NextRequest, ev: NextFetchEvent) {
  if (isMockMode()) {
    const mockSignedOut = req.cookies.get(MOCK_SIGNED_OUT_COOKIE)?.value === "1";
    if (mockSignedOut && !isPublicRoute(req)) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/sign-in", req.url)));
    }
    return withSecurityHeaders(NextResponse.next());
  }
  return clerkAware(req, ev);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
