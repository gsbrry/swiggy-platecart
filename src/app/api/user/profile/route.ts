import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { dietType, goal } from "@/lib/validation/common";

const patchSchema = z.object({
  goal: goal.optional(),
  diet_type: dietType.optional(),
  household_size: z.number().int().min(1).max(4).optional(),
  monthly_budget: z.number().nonnegative().optional(),
  eatout_per_week: z.number().int().min(0).max(21).optional(),
  exclusions: z.array(z.string().trim().min(1).max(50)).max(50).optional(),
});

/** GET the current user's profile. RLS: users row matched via Clerk userId. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ user });
}

/** PATCH profile fields. RLS: update filtered by internal users.id. */
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const p = parsed.data;
  const [updated] = await db
    .update(users)
    .set({
      goal: p.goal,
      dietType: p.diet_type,
      householdSize: p.household_size,
      monthlyBudget: p.monthly_budget?.toString(),
      eatoutPerWeek: p.eatout_per_week,
      exclusions: p.exclusions,
      updatedAt: new Date(),
    })
    // RLS: filter by userId
    .where(eq(users.id, user.id))
    .returning();

  return NextResponse.json({ user: updated });
}
