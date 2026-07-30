import { NextResponse } from "next/server";
import { and, eq, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { templateIngredients, templates } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { uuid } from "@/lib/validation/common";

/** POST fork a template: copy row + ingredients under current user, bump fork_count. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = uuid.safeParse(id);
  if (!parsed.success) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const source = await db.query.templates.findFirst({
    // RLS: filter by userId (public or owner)
    where: and(
      eq(templates.id, parsed.data),
      or(eq(templates.isPublic, true), eq(templates.creatorId, user.id)),
    ),
    with: { ingredients: true },
  });
  if (!source) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [copy] = await db
    .insert(templates)
    .values({
      creatorId: user.id,
      forkedFromId: source.id,
      dishName: source.dishName,
      tags: source.tags,
      isPublic: false,
      isPaid: false,
      price: "0",
    })
    .returning();

  if (source.ingredients.length > 0) {
    await db.insert(templateIngredients).values(
      source.ingredients.map((ing) => ({
        templateId: copy.id,
        ingredientName: ing.ingredientName,
        quantity: ing.quantity,
        unit: ing.unit,
        instamartSearchHint: ing.instamartSearchHint,
      })),
    );
  }

  await db
    .update(templates)
    .set({ forkCount: sql`${templates.forkCount} + 1` })
    .where(eq(templates.id, source.id));

  return NextResponse.json({ template: copy });
}
