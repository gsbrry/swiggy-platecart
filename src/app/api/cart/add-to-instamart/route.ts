import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { checkRateLimit } from "@/lib/rate-limit";
import { swiggyMcp } from "@/lib/swiggy-mcp";

const itemSchema = z.object({
  ingredient_name: z.string().min(1).max(80),
  quantity: z.number().nonnegative(),
  unit: z.string().max(20),
  instamart_search_hint: z.string().max(120).nullable().optional(),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(100),
});

/** POST forward the aggregated cart to Swiggy Instamart via server-side MCP stub. */
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

  // RLS: filter by userId — MCP call is scoped to the current user (auth-derived)
  const result = await swiggyMcp.cartAdd({
    items: parsed.data.items.map((i) => ({
      ingredient_name: i.ingredient_name,
      quantity: i.quantity,
      unit: i.unit,
      instamart_search_hint: i.instamart_search_hint ?? null,
    })),
  });

  return NextResponse.json(result);
}
