import { NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/db";
import { ordersLog } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { checkRateLimit } from "@/lib/rate-limit";

/** GET month-to-date spend split by source. RLS: filter by userId. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!checkRateLimit(user.id, "budget", 100)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const rows = await db
    .select({
      source: ordersLog.source,
      total: sql<string>`coalesce(sum(${ordersLog.totalAmount}), 0)`,
    })
    .from(ordersLog)
    // RLS: filter by userId
    .where(and(eq(ordersLog.userId, user.id), gte(ordersLog.orderedAt, monthStart)))
    .groupBy(ordersLog.source);

  let spentGroceries = 0;
  let spentEatout = 0;
  for (const r of rows) {
    if (r.source === "instamart") spentGroceries = Number(r.total);
    if (r.source === "food") spentEatout = Number(r.total);
  }

  const monthlyBudget = user.monthlyBudget ? Number(user.monthlyBudget) : 0;
  const remaining = Math.max(monthlyBudget - spentGroceries - spentEatout, 0);

  // Do not log raw amounts — mask instead.
  // eslint-disable-next-line no-console
  console.info("budget:summary", { userId: user.id, budget: "present" });

  return NextResponse.json({
    monthly_budget: monthlyBudget,
    spent_groceries: spentGroceries,
    spent_eatout: spentEatout,
    remaining,
  });
}
