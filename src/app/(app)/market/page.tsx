import Link from "next/link";

import { MenuCard, type MenuCardData } from "@/components/menus/menu-card";
import { DIET_LABEL, DIETS, PERIOD_LABEL, PERIODS, type Diet, type Meal, type Period } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Market",
  description: "Ready-made day, week and month meal plans from home cooks. Copy one into your calendar in a tap.",
};

const SORTS = { top: "Top rated", popular: "Most used", new: "Newest" } as const;
type Sort = keyof typeof SORTS;

export default async function MarketPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const period: Period = PERIODS.includes(sp.period as Period) ? (sp.period as Period) : "week";
  const diet = DIETS.includes(sp.diet as Diet) ? (sp.diet as Diet) : null;
  const sort: Sort = sp.sort && sp.sort in SORTS ? (sp.sort as Sort) : "top";

  const supabase = await createClient();
  let q = supabase
    .from("menus")
    .select("id, slug, title, period, diet, tags, rating_avg, rating_count, get_count, owner:profiles(display_name)")
    .eq("visibility", "public")
    .eq("status", "active")
    .eq("period", period)
    .limit(60);
  if (diet) q = q.eq("diet", diet);
  q =
    sort === "new"
      ? q.order("created_at", { ascending: false })
      : sort === "popular"
        ? q.order("get_count", { ascending: false }).order("rating_avg", { ascending: false })
        : q.order("rating_avg", { ascending: false }).order("get_count", { ascending: false });
  const { data: menus } = await q;

  const ids = (menus ?? []).map((m) => m.id);
  const { data: firstDay } = ids.length
    ? await supabase.from("menu_items").select("menu_id, meal, dish_name, is_eatout").in("menu_id", ids).eq("day_index", 0)
    : { data: [] };
  const order: Meal[] = ["breakfast", "lunch", "dinner"];
  const previews = new Map<string, string[]>();
  for (const it of [...(firstDay ?? [])].sort((a, b) => order.indexOf(a.meal as Meal) - order.indexOf(b.meal as Meal))) {
    const arr = previews.get(it.menu_id) ?? [];
    arr.push(it.is_eatout ? "Eating out" : it.dish_name ?? "");
    previews.set(it.menu_id, arr);
  }

  const cards: MenuCardData[] = (menus ?? []).map((m) => ({
    slug: m.slug,
    title: m.title,
    period: m.period as Period,
    diet: m.diet as Diet,
    tags: m.tags,
    rating_avg: Number(m.rating_avg),
    rating_count: m.rating_count,
    get_count: m.get_count,
    author: m.owner?.display_name ?? "Planetto Kitchen",
    preview: previews.get(m.id) ?? [],
  }));

  const href = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const merged: Record<string, string | null> = { period, diet, sort, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/market?${p.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="glass p-6 sm:p-8">
        <h1 className="text-[28px] font-semibold leading-tight sm:text-[40px]">
          Menus from <span className="text-appetite">real kitchens</span>
        </h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Ready-made days, weeks and months planned by home cooks. Use one and it fills your calendar. Free for now.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Menu length" className="flex gap-2">
          {PERIODS.map((p) => (
            <Link key={p} href={href({ period: p })} className="chip" aria-current={p === period ? "page" : undefined}>
              {PERIOD_LABEL[p]}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap gap-2">
          <nav aria-label="Diet" className="flex flex-wrap gap-2">
            <Link href={href({ diet: null })} className="chip" aria-current={!diet ? "page" : undefined}>All</Link>
            {DIETS.map((d) => (
              <Link key={d} href={href({ diet: d })} className="chip" aria-current={diet === d ? "page" : undefined}>{DIET_LABEL[d]}</Link>
            ))}
          </nav>
        </div>
      </div>
      <nav aria-label="Sort" className="flex items-center gap-1 text-sm">
        <span className="text-ink-muted">Sort:</span>
        {(Object.keys(SORTS) as Sort[]).map((s) => (
          <Link key={s} href={href({ sort: s })} aria-current={s === sort ? "page" : undefined} className={`rounded-full px-2.5 py-1.5 ${s === sort ? "font-semibold text-ink-orange" : "text-ink-muted hover:text-ink"}`}>
            {SORTS[s]}
          </Link>
        ))}
      </nav>

      {cards.length === 0 ? (
        <div className="surface p-8 text-center">
          <p className="text-lg font-semibold">No {PERIOD_LABEL[period].toLowerCase()} menus here yet</p>
          <p className="mt-1 text-ink-muted">Plan a {PERIOD_LABEL[period].toLowerCase()} you love, then publish it from your Plan page.</p>
          <Link href="/plan" className="btn-primary mt-4">Go to my plan</Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <li key={c.slug}>
              <MenuCard menu={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
