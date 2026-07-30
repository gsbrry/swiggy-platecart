import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  transcript: z.string().min(1).max(200),
});

/** POST parse a voice transcript into a dish query. Strict allowlist sanitization. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!checkRateLimit(user.id, "voice", 20)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  // Strict allowlist: alphanumeric + space, max 200 chars. Prevents injection into
  // downstream search / MCP calls.
  const sanitized = parsed.data.transcript
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .slice(0, 200);

  if (!sanitized) {
    return NextResponse.json({ dish_name: "", template_matches: [] });
  }

  return NextResponse.json({
    dish_name: sanitized,
    template_matches: [],
    ok: true,
    todo: "wire to templates search + fuzzy match",
  });
}
