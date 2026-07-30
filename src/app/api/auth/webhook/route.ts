import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

type ClerkEvent = {
  type: string;
  data: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    email_addresses?: { email_address: string }[];
  };
};

/**
 * Clerk webhook receiver. Verifies signature via svix, then upserts an
 * internal users row on `user.created`. Public route (no RLS applies —
 * request is authenticated by webhook secret, not a session).
 */
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 500 });
  }

  const hdrs = await headers();
  const svixId = hdrs.get("svix-id");
  const svixTimestamp = hdrs.get("svix-timestamp");
  const svixSignature = hdrs.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  let evt: ClerkEvent;
  try {
    evt = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const clerkId = evt.data.id;
    const displayName =
      evt.data.first_name ||
      evt.data.username ||
      evt.data.email_addresses?.[0]?.email_address ||
      null;

    // RLS: filter by clerkId (unique)
    const existing = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
    if (existing) {
      await db.update(users).set({ name: displayName, updatedAt: new Date() }).where(eq(users.clerkId, clerkId));
    } else {
      await db.insert(users).values({ clerkId, name: displayName });
    }
  }

  return NextResponse.json({ ok: true });
}
