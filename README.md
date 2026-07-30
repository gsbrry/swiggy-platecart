# PlateCart

Meal planning that fills your Instamart cart. Users pick weekly meal templates,
PlateCart aggregates the ingredients, and the Swiggy MCP pushes the resulting
shopping list straight into Instamart.

## Tech stack

- Next.js 14 (App Router) + TypeScript strict
- Tailwind CSS + shadcn/ui
- Clerk (Google + Phone/OTP auth)
- Neon PostgreSQL (via `@neondatabase/serverless` HTTP driver)
- Drizzle ORM + drizzle-kit
- Zod for input validation
- Svix for Clerk webhook verification
- Web Speech API (browser-only, Phase 1)
- Swiggy MCP (server-side only, Phase 1)
- Deploy: Vercel

## Getting started

```bash
cp .env.example .env.local
# fill in Clerk + Neon values
npm install
npm run dev
```

Then generate and apply the first migration:

```bash
npm run db:generate
npm run db:migrate
```

Optional: `npm run db:studio` to browse Drizzle Studio.

## Auth setup

1. Create a Clerk project. Enable Google + Phone/OTP under Authentication.
2. Set `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local`.
3. Configure the redirect URLs to `/` (after sign-in) and `/onboarding`
   (after sign-up). Values are wired via `NEXT_PUBLIC_CLERK_*` env vars.
4. Add a webhook endpoint pointing at `/api/auth/webhook` and copy the
   signing secret into `CLERK_WEBHOOK_SECRET`. Subscribe to `user.created`
   and `user.updated`.

## Security notes (for the Vercel review team)

- Auth: every non-public route is protected by `clerkMiddleware`. The only
  public routes are `/`, `/sign-in/*`, `/sign-up/*` and `/api/auth/webhook`.
- Authorisation: all API handlers resolve the internal `users` row from
  `auth().userId`, and every DB query is filtered by that id. Search for
  the comment `// RLS: filter by userId` to audit.
- Input validation: every write route uses a Zod schema; shared schemas live
  in `src/lib/validation/`.
- Rate limits: in-memory token buckets in `src/lib/rate-limit.ts`
  (`budget/summary`=100/min, `voice/parse`=20/min, `cart/*`=10/min).
  TODO comment marks the swap to Upstash Redis for production.
- Security headers: applied centrally in `src/middleware.ts` — CSP allows
  Clerk domains and self, plus `Permissions-Policy: microphone=(self)` for
  the Web Speech API. HSTS + nosniff + frame DENY + strict referrer.
- Voice input: strict allowlist (alphanumeric + space, 200 char cap) before
  anything hits the DB or the Swiggy MCP.
- Secrets: Swiggy MCP client is `SERVER-SIDE ONLY` and throws in prod when
  `SWIGGY_MCP_API_KEY` is missing.
- Logging: budget/order amounts are never logged raw — use masked markers
  like `budget:present`.

Quick header check once deployed:

```bash
curl -I https://<your-preview>.vercel.app/ | grep -Ei "content-security|permissions|strict-transport|x-frame"
```

## Reference material

- Architecture spec: [`docs/architecture/arcchitecture_v5.html`](docs/architecture/arcchitecture_v5.html)
- Screen mockups: [`docs/screens/`](docs/screens/)
- Screen → API mapping: [`docs/SCREENS.md`](docs/SCREENS.md)
