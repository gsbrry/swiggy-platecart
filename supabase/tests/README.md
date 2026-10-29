# Database tests

Run both in the Supabase SQL editor (or via the Supabase MCP `execute_sql`).

| File | What it checks | Side effects |
|---|---|---|
| `rls_smoke.sql` | Row Level Security and RPC guards with two simulated users and an anonymous visitor. | None (wrapped in a transaction that rolls back). |
| `api_e2e.sql` | The app's real PostgREST queries and RPCs over HTTPS as a signed-in user: onboarding, dish picker, slot upserts, save dish, create/share menu, market, get menu, rating, shopping list, admin lock-out. | Creates a confirmed test user `e2e-tester@planetto.test`, then deletes it (cascade). Needs the `http` extension, which the script enables and drops again. |

Every `api_e2e.sql` step should return a 2xx status, except `admin_reports as non-admin`, which must be 403.
