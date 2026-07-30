import { NextResponse } from "next/server";
import { desc, eq, gte, sql } from "drizzle-orm";

import { db } from "@/db";
import { wasteLog } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";

/** GET ingredients with 2+ waste events (repeat offenders). RLS: filter by userId. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const countExpr = sql<number>`count(*)::int`;

  const rows = await db
    .select({
      ingredient_name: wasteLog.ingredientName,
      count: countExpr,
    })
    .from(wasteLog)
    // RLS: filter by userId
    .where(eq(wasteLog.userId, user.id))
    .groupBy(wasteLog.ingredientName)
    .having(gte(countExpr, 2))
    .orderBy(desc(countExpr));

  return NextResponse.json({ patterns: rows });
}
