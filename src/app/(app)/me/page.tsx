import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Settings, ShieldCheck } from "lucide-react";

import { MenuCard, type MenuCardData } from "@/components/menus/menu-card";
import { Avatar } from "@/components/ui/avatar";
import { getMe } from "@/lib/auth";
import { DIET_LABEL, VISIBILITY_LABEL, type Diet, type Period, type Visibility } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My profile" };

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

type CardRow = { slug: string; title: string; period: string; diet: string; tags: string[]; rating_avg: number; rating_count: number; get_count: number };

function toCard(m: CardRow, author: string): MenuCardData {
  return {
    slug: m.slug,
    title: m.title,
    period: m.period as Period,
    diet: m.diet as Diet,
    tags: m.tags,
    rating_avg: Number(m.rating_avg),
    rating_count: m.rating_count,
    get_count: m.get_count,
    author,
    preview: [],
  };
}

export default async function MePage() {
  const me = await getMe();
  if (!me) redirect("/sign-in?next=/me");
  const supabase = await createClient();

  const [{ data: mine }, { data: used }, { count: dishCount }] = await Promise.all([
    supabase
      .from("menus")
      .select("slug, title, period, diet, tags, rating_avg, rating_count, get_count, visibility")
      .eq("owner_id", me.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("menu_acquisitions")
      .select("start_date, menu:menus(slug, title, period, diet, tags, rating_avg, rating_count, get_count, owner:profiles!menus_owner_id_fkey(display_name))")
      .eq("user_id", me.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("dishes").select("id", { count: "exact", head: true }).eq("owner_id", me.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="glass flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={me.profile.display_name} url={me.profile.avatar_url} size={72} />
          <div className="min-w-0">
            <h1 className="truncate text-[28px] font-semibold leading-tight">{me.profile.display_name}</h1>
            <p className="text-ink-muted">
              {me.profile.username ? `@${me.profile.username}` : "No username yet"} · {plural(mine?.length ?? 0, "menu")} ·{" "}
              {plural(dishCount ?? 0, "dish", "dishes")}
            </p>
            {me.profile.bio && <p className="mt-1 max-w-md">{me.profile.bio}</p>}
            <p className="mt-1 text-sm text-ink-muted">
              {DIET_LABEL[(me.settings.diet ?? "veg") as Diet]} · cooking for {me.settings.household_size}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/me/settings" className="btn-secondary btn-sm"><Settings className="h-4 w-4" /> Settings</Link>
          <Link href="/dishes?tab=mine" className="btn-secondary btn-sm"><BookOpen className="h-4 w-4" /> My dishes</Link>
          {me.isAdmin && (
            <Link href="/admin" className="btn-secondary btn-sm"><ShieldCheck className="h-4 w-4" /> Moderation</Link>
          )}
        </div>
      </header>

      <section id="menus" aria-labelledby="my-menus" className="scroll-mt-24 space-y-3">
        <h2 id="my-menus" className="text-[22px] font-semibold">My menus</h2>
        {mine?.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((m) => (
              <li key={m.slug}>
                <MenuCard menu={toCard(m, "you")} badge={VISIBILITY_LABEL[m.visibility as Visibility]} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="surface p-6">
            <p className="font-semibold">You haven&apos;t shared a menu yet</p>
            <p className="mt-1 text-ink-muted">Plan a week you like, then tap &ldquo;Share&rdquo; on the Plan page to send it or publish it to the Market.</p>
            <Link href="/plan" className="btn-primary btn-sm mt-4">Go to my plan</Link>
          </div>
        )}
      </section>

      {used && used.length > 0 && (
        <section aria-labelledby="used-menus" className="space-y-3">
          <h2 id="used-menus" className="text-[22px] font-semibold">Menus I&apos;ve used</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {used
              .filter((u) => u.menu)
              .map((u) => (
                <li key={u.menu!.slug}>
                  <MenuCard menu={toCard(u.menu!, u.menu!.owner?.display_name ?? "Planetto Kitchen")} />
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
