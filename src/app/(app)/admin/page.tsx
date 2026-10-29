import { notFound } from "next/navigation";

import { moderate } from "@/lib/actions/admin";
import { getMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Moderation", robots: { index: false } };

export default async function AdminPage() {
  const me = await getMe();
  if (!me?.isAdmin) notFound();
  const supabase = await createClient();
  const { data: reports } = await supabase.rpc("admin_reports");

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-[28px] font-semibold">Moderation queue</h1>
      <p className="text-ink-muted">Open reports. Hiding resolves every report on that item. Aim to act within 48 hours.</p>
      {!reports?.length ? (
        <p className="surface p-6 text-ink-muted">Nothing to review.</p>
      ) : (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li key={r.id} className="surface-solid flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-ink-muted">
                  {r.target_type} · {r.report_count} report{r.report_count > 1 ? "s" : ""} · {r.target_status}
                </p>
                <p className="truncate font-semibold">{r.label ?? "(deleted)"}</p>
                <p className="text-sm text-ink-muted">&ldquo;{r.reason}&rdquo;</p>
              </div>
              <form action={moderate} className="flex shrink-0 gap-2">
                <input type="hidden" name="type" value={r.target_type} />
                <input type="hidden" name="id" value={r.target_id} />
                <button name="status" value="hidden" className="btn btn-sm border border-danger text-danger">Hide</button>
                <button name="status" value="active" className="btn-secondary btn-sm">Keep</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
