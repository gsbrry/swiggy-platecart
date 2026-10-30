"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { zUuid } from "@/lib/validation";

/** Hide or restore reported content. The RPC itself re-checks that the caller is an admin. */
export async function moderate(form: FormData): Promise<void> {
  const parsed = z
    .object({ type: z.enum(["menu", "rating", "dish"]), id: zUuid, status: z.enum(["active", "hidden"]) })
    .safeParse({ type: form.get("type"), id: form.get("id"), status: form.get("status") });
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.rpc("admin_set_status", { p_type: parsed.data.type, p_id: parsed.data.id, p_status: parsed.data.status });
  revalidatePath("/admin");
  revalidatePath("/market");
}
