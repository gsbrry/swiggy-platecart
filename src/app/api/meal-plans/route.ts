import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { mealPlans } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { isoDate } from "@/lib/validation/common";

const postSchema = z.object({ week_start: isoDate });

/** POST create a new weekly plan for the current user. RLS: userId set from auth. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const [plan] = await db
    .insert(mealPlans)
    .values({
      // RLS: userId sourced from server-side auth, never the request body
      userId: user.id,
      weekStart: parsed.data.week_start,
    })
    .returning();

  return NextResponse.json({ plan });
}
