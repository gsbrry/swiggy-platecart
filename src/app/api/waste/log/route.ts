import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { wasteLog } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { safeText, wasteLevel } from "@/lib/validation/common";

const bodySchema = z.object({
  ingredient_name: safeText(80),
  waste_level: wasteLevel,
});

/** POST log a waste event for the current user. RLS: userId set from auth. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const [row] = await db
    .insert(wasteLog)
    .values({
      // RLS: userId sourced from auth
      userId: user.id,
      ingredientName: parsed.data.ingredient_name,
      wasteLevel: parsed.data.waste_level,
    })
    .returning();

  return NextResponse.json({ entry: row });
}
