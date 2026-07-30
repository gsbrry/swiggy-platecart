import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { mealPlanSlots, mealPlans } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { mealType, uuid } from "@/lib/validation/common";

const patchSchema = z.object({
  day_of_week: z.number().int().min(1).max(7),
  meal_type: mealType,
  template_id: uuid.nullable().optional(),
  is_eatout: z.boolean().optional(),
});

/** PATCH assign template (or mark eat-out) for a slot. RLS: verify meal plan belongs to user. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const idParsed = uuid.safeParse(id);
  if (!idParsed.success) return NextResponse.json({ error: "invalid meal plan id" }, { status: 400 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  // RLS: verify meal plan belongs to user before mutating slots
  const plan = await db.query.mealPlans.findFirst({
    where: and(eq(mealPlans.id, idParsed.data), eq(mealPlans.userId, user.id)),
  });
  if (!plan) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { day_of_week, meal_type, template_id, is_eatout } = parsed.data;

  // Upsert-ish: try update, insert if missing.
  const existing = await db.query.mealPlanSlots.findFirst({
    where: and(
      eq(mealPlanSlots.mealPlanId, plan.id),
      eq(mealPlanSlots.dayOfWeek, day_of_week),
      eq(mealPlanSlots.mealType, meal_type),
    ),
  });

  let slot;
  if (existing) {
    [slot] = await db
      .update(mealPlanSlots)
      .set({ templateId: template_id ?? null, isEatout: is_eatout ?? false })
      .where(eq(mealPlanSlots.id, existing.id))
      .returning();
  } else {
    [slot] = await db
      .insert(mealPlanSlots)
      .values({
        mealPlanId: plan.id,
        dayOfWeek: day_of_week,
        mealType: meal_type,
        templateId: template_id ?? null,
        isEatout: is_eatout ?? false,
      })
      .returning();
  }

  return NextResponse.json({ slot });
}
