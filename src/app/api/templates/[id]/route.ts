import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { templates } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { uuid } from "@/lib/validation/common";

/** GET a single template with ingredients. RLS: allow when public OR owned by user. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = uuid.safeParse(id);
  if (!parsed.success) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const tpl = await db.query.templates.findFirst({
    // RLS: filter by userId (public or owner)
    where: and(
      eq(templates.id, parsed.data),
      or(eq(templates.isPublic, true), eq(templates.creatorId, user.id)),
    ),
    with: { ingredients: true },
  });

  if (!tpl) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ template: tpl });
}
