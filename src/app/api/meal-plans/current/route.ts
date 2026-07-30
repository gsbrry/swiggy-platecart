import { NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import { mealPlans } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";

function currentWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  return monday.toISOString().slice(0, 10);
}

/** GET the user's current week meal plan with slots + template join. RLS: filter by userId. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const weekStart = currentWeekStart();

  const plan = await db.query.mealPlans.findFirst({
    // RLS: filter by userId
    where: and(eq(mealPlans.userId, user.id), gte(mealPlans.weekStart, weekStart)),
    with: {
      slots: {
        with: { template: true },
      },
    },
  });

  return NextResponse.json({ plan: plan ?? null, week_start: weekStart });
}
