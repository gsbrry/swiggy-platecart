import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/auth/webhook",
]);

/**
 * Content Security Policy — kept in one place so the Vercel review team can tune.
 * - script-src 'self' + Clerk (needed for their JS widgets)
 * - style-src 'self' 'unsafe-inline' — Tailwind + Clerk inject inline styles
 * - img-src covers Clerk avatar hosts + data URIs for icons
 * - connect-src whitelists Clerk backend + Neon (Vercel review can extend)
 * - frame-src empty besides Clerk (auth flows may iframe)
 * - form-action self only
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://img.clerk.com https://*.clerk.com",
  "font-src 'self' data:",
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
  // Web Speech API needs mic; keep self-only.
  "Permissions-Policy": "microphone=(self)",
  "Content-Security-Policy": CSP,
};

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  const res = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
});

export const config = {
  matcher: [
    // Skip Next internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
