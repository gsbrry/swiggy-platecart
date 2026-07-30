import { NextResponse } from "next/server";
import { and, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { templates } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { checkRateLimit } from "@/lib/rate-limit";
import { isoDate, uuid } from "@/lib/validation/common";

const bodySchema = z.object({
  template_ids: z.array(uuid).min(1).max(50),
  date: isoDate.optional(),
});

type Item = {
  ingredient_name: string;
  quantity: number;
  unit: string;
  instamart_search_hint: string | null;
};

/** POST build an aggregated shopping list from a set of templates. RLS: filter by userId. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!checkRateLimit(user.id, "cart", 10)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  // RLS: filter by userId — only aggregate templates the caller can access
  const rows = await db.query.templates.findMany({
    where: and(
      inArray(templates.id, parsed.data.template_ids),
      or(eq(templates.isPublic, true), eq(templates.creatorId, user.id)),
    ),
    with: { ingredients: true },
  });

  const byKey = new Map<string, Item>();
  for (const t of rows) {
    for (const ing of t.ingredients) {
      const unit = ing.unit ?? "";
      const key = `${ing.ingredientName.toLowerCase()}::${unit.toLowerCase()}`;
      const qty = ing.quantity ? Number(ing.quantity) : 0;
      const prev = byKey.get(key);
      if (prev) {
        prev.quantity += qty;
      } else {
        byKey.set(key, {
          ingredient_name: ing.ingredientName,
          quantity: qty,
          unit,
          instamart_search_hint: ing.instamartSearchHint ?? null,
        });
      }
    }
  }

  return NextResponse.json({ items: Array.from(byKey.values()) });
}
