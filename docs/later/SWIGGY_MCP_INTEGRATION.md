# Swiggy MCP Integration Guide

Everything a developer needs to wire PlateCart's cart-push flow into the Swiggy
Builders Club MCP. Read this before touching `src/lib/swiggy-mcp.ts` or adding
the OAuth callback route.

**Official docs:** https://mcp.swiggy.com/builders/docs/
**Contact:** builders@swiggy.in
**Status:** Application submitted. Local development is allowed without approval —
production access requires a demo video.

---

## 1. Protocol summary

- **Standard:** Model Context Protocol (MCP) over streamable HTTP — no bespoke SDK.
- **Base URL:** `https://mcp.swiggy.com`
- **Auth:** OAuth 2.1 with PKCE. **Not** a static API key. Each end-user logs into
  Swiggy and PlateCart stores *their* access token.
- **Servers we care about:**
  - Instamart → `POST https://mcp.swiggy.com/im` (grocery cart / checkout)
  - Food → `POST https://mcp.swiggy.com/food` (not used by PlateCart today)
  - Dineout → `POST https://mcp.swiggy.com/dineout` (not used)

---

## 2. OAuth 2.1 + PKCE flow

### Endpoints

| Method | URL | Purpose |
|--------|-----|---------|
| `GET`  | `https://mcp.swiggy.com/auth/authorize` | Consent screen — send user here |
| `POST` | `https://mcp.swiggy.com/auth/token` | Exchange code for access token |
| `POST` | `https://mcp.swiggy.com/auth/logout` | Revoke session |
| `GET`  | `https://mcp.swiggy.com/.well-known/oauth-authorization-server` | Server metadata (RFC 8414) |
| `GET`  | `https://mcp.swiggy.com/.well-known/oauth-protected-resource` | Resource metadata (RFC 9728) |

### Redirect URI rules

- HTTPS required in production; `http://localhost` allowed in dev.
- **Exact-match allowlist, no wildcards.** Register each preview URL separately
  or route them through a stable proxy.
- Custom schemes supported (`cursor://`, `vscode://`, etc.) — not relevant for us.
- To add/change URIs post-approval, email `builders@swiggy.in`.

**PlateCart redirect URIs (to register):**
- Dev: `http://localhost:3000/api/auth/swiggy/callback`
- Prod (fill in once deployed): `https://<domain>/api/auth/swiggy/callback`

### Scopes

- `mcp:tools` — call MCP tools (this is the one we need)
- `mcp:resources` — widget registry / static metadata
- `mcp:prompts` — server-supplied prompt templates

### Step 1 — Generate PKCE pair (server side)

```ts
import crypto from "node:crypto";

export function makePkce() {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}
```

Persist `codeVerifier` + `state` in a short-lived server-side store (signed
cookie or Redis) keyed by `state`. Never send `codeVerifier` to the browser.

### Step 2 — Redirect user to Swiggy

```
https://mcp.swiggy.com/auth/authorize
  ?response_type=code
  &client_id=<from-registration>
  &redirect_uri=<your-callback>
  &code_challenge=<codeChallenge>
  &code_challenge_method=S256
  &state=<random-csrf-token>
  &scope=mcp:tools
```

### Step 3 — Exchange code at `/api/auth/swiggy/callback`

```ts
const res = await fetch("https://mcp.swiggy.com/auth/token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    grant_type: "authorization_code",
    code,                       // from ?code= query param
    code_verifier: codeVerifier, // recovered from store using ?state=
    redirect_uri: process.env.SWIGGY_REDIRECT_URI,
  }),
});

const {
  access_token,   // eyJhbGciOi...
  token_type,     // "Bearer"
  expires_in,     // 432000 (5 days, in seconds)
  scope,          // "mcp:tools mcp:resources mcp:prompts"
} = await res.json();
```

### Token lifecycle

| Item | Lifetime |
|------|----------|
| Access token | **5 days** (432000 s) |
| User session (idle sliding) | 30 days |
| Authorization code | 120 s, single-use |
| Refresh token | **Not issued in v1.0** — re-run the full flow when 401 |

Store `expires_at = Date.now() + expires_in * 1000`. Proactively re-auth if
`< 60 s` remain. Treat any `401` as "restart authorization" — never assume the
token is still valid.

### Step 4 — Persist per-user

Add a `swiggy_tokens` table (or extend `users`):

```
user_id           uuid  (FK → users.id, unique)
access_token      text  (encrypted at rest)
scope             text
expires_at        timestamptz
created_at        timestamptz  default now()
updated_at        timestamptz
```

Encrypt with a KMS or app-level AES-GCM before write. Never log token bodies.

---

## 3. Calling MCP tools

Every tool call is a POST to the server URL with `Authorization: Bearer` and an
MCP-standard JSON body.

```
POST https://mcp.swiggy.com/im
Authorization: Bearer <access_token>
Content-Type: application/json
```

Prefer the official MCP client rather than raw fetch:

```ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("https://mcp.swiggy.com/im"),
  { requestInit: { headers: { Authorization: `Bearer ${accessToken}` } } },
);
const client = new Client({ name: "platecart", version: "0.1.0" });
await client.connect(transport);

const cart = await client.callTool({ name: "get_cart", arguments: {} });
```

### Retry / 401 handling

```ts
async function callWithReauth<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (e?.status === 401) {
      // Kick user back through /auth/authorize — no silent refresh in v1.0
      await reAuthenticate();
      return fn();
    }
    throw e;
  }
}
```

Retry policy for 5xx / network: 2 retries, exponential backoff (500 ms, 2 s),
10 s per-attempt timeout via `AbortController`.

---

## 4. Instamart tools PlateCart uses

Endpoint: `POST https://mcp.swiggy.com/im`

### Discover

| Tool | Purpose | Args |
|------|---------|------|
| `get_addresses` | List user's saved addresses (recency-sorted). Call first to pick delivery. | — |
| `create_address` | Add a new delivery address | address fields |
| `delete_address` | Remove a saved address | `addressId` |
| `search_products` | Resolve an ingredient name → real Instamart SKUs at the given address | `addressId`, `query` |
| `your_go_to_items` | Frequently / recently bought items — good for suggestions | `addressId` |

### Cart

| Tool | Purpose | Args |
|------|---------|------|
| `get_cart` | Read current cart + bill breakdown | — |
| `update_cart` | **Replaces the entire cart** with the given items. This is PlateCart's push-to-cart. | `items[]` |
| `clear_cart` | Empty the cart | — |

> `update_cart` is destructive — it replaces, not appends. Always send the full
> desired basket, and warn the user if they had non-PlateCart items in the cart.

### Checkout

| Tool | Purpose | Args |
|------|---------|------|
| `get_payment_options` | Payment methods for the current cart | — |
| `checkout` | Place & confirm order, kicks off payment | cart + address |
| `check_payment_status` | Poll UPI / gateway status | `paymentId` |
| `confirm_order` | Finalize a pending order to `PLACED` | `orderId` |

### Track

| Tool | Purpose | Args |
|------|---------|------|
| `get_orders` | Order history | — |
| `track_order` | **Primary** live tracker | `orderId` |
| `get_order_details` | Full detail on one order | `orderId` |

### Support

| Tool | Purpose | Args |
|------|---------|------|
| `report_error` | File an error report for Swiggy support | error payload |

---

## 5. PlateCart happy path

```
User taps "Send to Instamart"
  ↓
/api/cart/add-to-instamart  (server route)
  ↓
loadSwiggyToken(userId)         → 401? redirect to /api/auth/swiggy/start
  ↓
get_addresses                    → pick primary (or ask user)
  ↓
for each meal-plan ingredient:
  search_products(addressId, name)  → pick top SKU (respect quantity/unit)
  ↓
update_cart({ items: [...resolvedSkus] })
  ↓
persist order_ref + item list to orders_log
  ↓
return { ok, cart } to client
```

Checkout (`checkout` → `confirm_order`) is a separate step — PlateCart v1 stops
at "cart populated, user finishes in Swiggy app." Wire the checkout tools in v2
once the cart flow is stable.

---

## 6. Required environment variables

Add these to `.env.local` (and `.env.example`, no values):

```
SWIGGY_MCP_BASE_URL=https://mcp.swiggy.com
SWIGGY_MCP_CLIENT_ID=<from Swiggy registration>
SWIGGY_MCP_CLIENT_SECRET=<from Swiggy registration>   # if issued
SWIGGY_REDIRECT_URI=http://localhost:3000/api/auth/swiggy/callback
SWIGGY_TOKEN_ENC_KEY=<32-byte base64 key for AES-GCM at-rest encryption>
```

All server-only — **never** prefix with `NEXT_PUBLIC_`.

---

## 7. Files to create / change

| File | Purpose |
|------|---------|
| `src/lib/swiggy-mcp.ts` | Replace stub. Export `getMcpClient(userId)` + typed helpers (`searchProducts`, `updateCart`, `checkout`). Owns retry + 401 handling. |
| `src/lib/swiggy-oauth.ts` | PKCE helpers, state store, token exchange. |
| `src/lib/swiggy-tokens.ts` | Load / save / encrypt tokens. Backed by new `swiggy_tokens` table. |
| `src/app/api/auth/swiggy/start/route.ts` | Generates PKCE pair, stores `{state, codeVerifier}` server-side, 302s to `/auth/authorize`. |
| `src/app/api/auth/swiggy/callback/route.ts` | Verifies `state`, exchanges `code`, persists token, redirects to `/dashboard`. |
| `src/db/schema.ts` | Add `swiggyTokens` table. |
| `drizzle/…` | Migration for new table. |
| `src/app/api/cart/add-to-instamart/route.ts` | Orchestrates `get_addresses` → `search_products` → `update_cart`. |
| `.env.example` | Add the vars above (empty values). |

---

## 8. Local development checklist

1. Register a dev app (once approved) with redirect `http://localhost:3000/api/auth/swiggy/callback`.
2. Fill `.env.local`, restart `npm run dev`.
3. Visit `/api/auth/swiggy/start` → complete Swiggy login → land back on `/dashboard`.
4. Confirm a row landed in `swiggy_tokens` with a 5-day `expires_at`.
5. Trigger "Send to Instamart" on a meal plan.
6. Verify `update_cart` populated the cart via the Swiggy consumer app (same account).
7. Record a Loom of the full flow → email `builders@swiggy.in` for prod access.

---

## 9. Known gotchas

- **No refresh tokens in v1.0.** Design UX for occasional re-login; don't cache
  tokens on the client.
- **`update_cart` replaces the cart** — merge with existing items yourself if you
  want additive behavior (call `get_cart` first).
- **Exact-match redirect URIs.** Netlify preview URLs won't work unless
  individually registered. Prefer a stable staging domain or skip Swiggy calls
  on previews.
- **5-day access tokens** are long — encrypt at rest, rotate on logout, and
  invalidate on password change (via `/auth/logout`).
- **Authorization codes are single-use and expire in 120 s.** Handle callback
  errors gracefully.
- Address selection matters — Instamart availability + SKUs are per-address.
  Always pass the same `addressId` across `search_products` and `update_cart`.
