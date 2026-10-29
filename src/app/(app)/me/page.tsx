import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";

import { MenuCard, type MenuCardData } from "@/components/menus/menu-card";
import { PreferencesForm, ProfileForm } from "@/components/me/forms";
import { deleteAccount } from "@/lib/actions/profile";
import { getMe } from "@/lib/auth";
import { VISIBILITY_LABEL, type Diet, type Period, type Visibility } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Me" };

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export default async function MePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await getMe();
  if (!me) redirect("/sign-in?next=/me");
  const { error } = await searchParams;
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

  const toCard = (m: { slug: string; title: string; period: string; diet: string; tags: string[]; rating_avg: number; rating_count: number; get_count: number }, author: string): MenuCardData => ({
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
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="glass flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight">{me.profile.display_name}</h1>
          <p className="text-ink-muted">
            {me.profile.username ? `@${me.profile.username}` : "No username yet"} · {plural(mine?.length ?? 0, "menu")} · {plural(dishCount ?? 0, "dish", "dishes")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dishes?tab=mine" className="btn-secondary btn-sm">My dishes</Link>
          {me.isAdmin && (
            <Link href="/admin" className="btn-secondary btn-sm"><ShieldCheck className="h-4 w-4" /> Moderation</Link>
          )}
          <form action="/auth/sign-out" method="post">
            <button className="btn-ghost btn-sm"><LogOut className="h-4 w-4" /> Sign out</button>
          </form>
        </div>
      </header>

      <section aria-labelledby="my-menus" className="space-y-3">
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
          <p className="text-ink-muted">
            You haven&apos;t shared a menu yet. On your <Link href="/plan" className="text-ink-orange underline">Plan</Link>, tap &ldquo;Share or publish&rdquo;.
          </p>
        )}
      </section>

      {used && used.length > 0 && (
        <section aria-labelledby="used-menus" className="space-y-3">
          <h2 id="used-menus" className="text-[22px] font-semibold">Menus I&apos;ve used</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {used.filter((u) => u.menu).map((u) => (
              <li key={u.menu!.slug}>
                <MenuCard menu={toCard(u.menu!, u.menu!.owner?.display_name ?? "Planetto Kitchen")} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="profile-h" className="surface-solid space-y-4 p-6">
        <h2 id="profile-h" className="text-lg font-semibold">Profile</h2>
        <ProfileForm initial={{ display_name: me.profile.display_name, username: me.profile.username ?? "", bio: me.profile.bio ?? "" }} />
      </section>

      <section id="preferences" aria-labelledby="prefs-h" className="surface-solid space-y-4 p-6">
        <h2 id="prefs-h" className="text-lg font-semibold">Food preferences</h2>
        <p className="-mt-2 text-sm text-ink-muted">Private. Used to suggest dishes and size your shopping list.</p>
        <PreferencesForm initial={{ diet: (me.settings.diet ?? "veg") as Diet, exclusions: me.settings.exclusions, household_size: me.settings.household_size }} />
      </section>

      <section aria-labelledby="danger-h" className="space-y-3 rounded-xl border border-danger/25 bg-white p-6">
        <h2 id="danger-h" className="text-lg font-semibold text-danger">Delete account</h2>
        <p className="text-sm text-ink-muted">
          This permanently deletes your account, plan, dishes, menus and ratings. It can&apos;t be undone.
        </p>
        {error === "confirm" && <p role="alert" className="text-sm text-danger">Type DELETE to confirm.</p>}
        {error === "delete" && <p role="alert" className="text-sm text-danger">We couldn&apos;t delete your account. Please try again.</p>}
        <form action={deleteAccount} className="flex flex-wrap gap-2">
          <label htmlFor="confirm" className="sr-only">Type DELETE to confirm</label>
          <input id="confirm" name="confirm" placeholder="Type DELETE" className="input w-44" autoComplete="off" />
          <button className="btn btn-sm border border-danger text-danger hover:bg-danger/5">Delete my account</button>
        </form>
      </section>
    </div>
  );
}
