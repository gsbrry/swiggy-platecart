import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { isMockMode, mockUser } from "@/lib/mock";

/**
 * Resolve (or lazily create) the internal `users` row for the currently
 * authenticated Clerk user. Returns `null` when unauthenticated so callers can
 * respond with 401 without throwing.
 */
export async function getCurrentUser() {
  if (isMockMode()) return mockUser;

  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  // RLS: filter by clerkId (unique)
  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (existing) return existing;

  const clerk = await currentUser();
  const displayName =
    clerk?.firstName || clerk?.username || clerk?.emailAddresses?.[0]?.emailAddress || null;

  const [created] = await db
    .insert(users)
    .values({
      clerkId,
      name: displayName,
    })
    .returning();

  return created;
}

export type InternalUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
