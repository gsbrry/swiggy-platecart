import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

type RealDb = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Lazy Drizzle client. Constructing at module load would throw when
 * DATABASE_URL is missing (e.g. mock mode with no .env.local), so we defer
 * until first use.
 */
let _db: RealDb | null = null;
function client(): RealDb {
  if (_db) return _db;
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required. Set it in .env.local, or use mock mode " +
        "(omit NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) if you just want to browse the UI.",
    );
  }
  const sql = neon(process.env.DATABASE_URL);
  _db = drizzle(sql, { schema });
  return _db;
}

// Proxy so callers can keep writing `db.query.users.findFirst(...)` unchanged.
export const db = new Proxy({} as RealDb, {
  get(_target, prop) {
    return Reflect.get(client() as unknown as object, prop);
  },
}) as RealDb;

export type Db = RealDb;
export { schema };
