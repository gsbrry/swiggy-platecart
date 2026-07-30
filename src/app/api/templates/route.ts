import { NextResponse } from "next/server";
import { and, arrayOverlaps, desc, eq, ilike, lt, or, SQL } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { templateIngredients, templates } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { safeText } from "@/lib/validation/common";

const querySchema = z.object({
  lane: z.string().max(50).optional(),
  goal: z.string().max(50).optional(),
  cuisine: z.string().max(50).optional(),
  diet: z.string().max(50).optional(),
  q: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().datetime().optional(),
  creator_id: z.string().optional(),
});

/** GET list public templates (plus own). RLS: creator visibility filter by userId when creator_id=me. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid query", issues: parsed.error.issues }, { status: 400 });
  }

  const { lane, goal, cuisine, diet, q, limit, cursor, creator_id } = parsed.data;
  const tagFilters = [lane, goal, cuisine, diet].filter((t): t is string => Boolean(t));

  const conditions: SQL[] = [];
  if (creator_id === "me") {
    // RLS: filter by userId
    conditions.push(eq(templates.creatorId, user.id));
  } else {
    // RLS: public feed OR user's own rows
    conditions.push(or(eq(templates.isPublic, true), eq(templates.creatorId, user.id))!);
  }
  if (tagFilters.length) conditions.push(arrayOverlaps(templates.tags, tagFilters));
  if (q) conditions.push(ilike(templates.dishName, `%${q}%`));
  if (cursor) conditions.push(lt(templates.createdAt, new Date(cursor)));

  const rows = await db
    .select()
    .from(templates)
    .where(and(...conditions))
    .orderBy(desc(templates.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]!.createdAt.toISOString() : null;

  return NextResponse.json({ items, next_cursor: nextCursor });
}

const ingredientSchema = z.object({
  ingredient_name: safeText(80),
  quantity: z.number().positive().optional(),
  unit: z.string().max(20).optional(),
  instamart_search_hint: z.string().max(120).optional(),
});

const postSchema = z.object({
  dish_name: safeText(100),
  tags: z.array(z.string().max(40)).max(20).optional(),
  is_public: z.boolean().optional(),
  is_paid: z.boolean().optional(),
  price: z.number().nonnegative().optional(),
  ingredients: z.array(ingredientSchema).min(1).max(50),
});

/** POST create a new template + ingredients. RLS: creatorId set from auth. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const p = parsed.data;
  const [tpl] = await db
    .insert(templates)
    .values({
      creatorId: user.id,
      dishName: p.dish_name,
      tags: p.tags ?? [],
      isPublic: p.is_public ?? false,
      isPaid: p.is_paid ?? false,
      price: (p.price ?? 0).toString(),
    })
    .returning();

  await db.insert(templateIngredients).values(
    p.ingredients.map((i) => ({
      templateId: tpl.id,
      ingredientName: i.ingredient_name,
      quantity: i.quantity?.toString(),
      unit: i.unit,
      instamartSearchHint: i.instamart_search_hint,
    })),
  );

  return NextResponse.json({ template: tpl });
}
