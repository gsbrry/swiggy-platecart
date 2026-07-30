import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

// Neon HTTP driver — required for Vercel serverless (no long-lived TCP connections).
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });

export type Db = typeof db;
export { schema };
