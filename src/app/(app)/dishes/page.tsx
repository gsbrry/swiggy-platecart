import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { DishCard, type DishCardData } from "@/components/dishes/dish-card";
import { getUserId } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { DIET_LABEL, DIETS, type Diet } from "@/lib/labels";

export const metadata = { title: "Dishes" };

type Tab = "library" | "mine" | "community";

export default async function DishesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const userId = await getUserId();
  const tab: Tab = sp.tab === "mine" && userId ? "mine" : sp.tab === "community" ? "community" : "library";
  const q = (sp.q ?? "").slice(0, 60).trim();
  const diet = DIETS.includes(sp.diet as Diet) ? (sp.diet as Diet) : null;

  const supabase = await createClient();
  let query = supabase
    .from("dishes")
    .select("id, name, diet, tags, cook_minutes, fork_count, owner_id, is_public")
    .eq("status", "active")
    .order(tab === "community" ? "fork_count" : "name", { ascending: tab !== "community" })
    .limit(120);
  if (tab === "library") query = query.is("owner_id", null);
  if (tab === "mine" && userId) query = query.eq("owner_id", userId);
  if (tab === "community") query = query.not("owner_id", "is", null).eq("is_public", true);
  if (diet) query = query.eq("diet", diet);
  // Escape LIKE wildcards so user input is matched literally.
  if (q) query = query.ilike("name", `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`);
  const { data } = await query;
  const dishes = (data ?? []) as DishCardData[];

  const href = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const merged = { tab, q: q || null, diet, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v && !(k === "tab" && v === "library")) p.set(k, v);
    const s = p.toString();
    return `/dishes${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight">Dishes</h1>
          <p className="text-ink-muted">Recipes you can drop into any meal slot.</p>
        </div>
        <Link href={userId ? "/dishes/new" : "/sign-in?next=/dishes/new"} className="btn-primary btn-sm">
          <Plus className="h-4 w-4" /> New dish
        </Link>
      </div>

      <nav aria-label="Dish lists" className="flex flex-wrap gap-2">
        <Link href={href({ tab: "library" })} className="chip" aria-current={tab === "library" ? "page" : undefined}>Planetto Kitchen</Link>
        {userId && <Link href={href({ tab: "mine" })} className="chip" aria-current={tab === "mine" ? "page" : undefined}>My dishes</Link>}
        <Link href={href({ tab: "community" })} className="chip" aria-current={tab === "community" ? "page" : undefined}>Community</Link>
      </nav>

      <form className="flex flex-col gap-2 sm:flex-row" role="search">
        <input type="hidden" name="tab" value={tab} />
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
          <input name="q" defaultValue={q} placeholder="Search dishes" aria-label="Search dishes" className="input pl-10" maxLength={60} />
        </div>
        <select name="diet" defaultValue={diet ?? ""} aria-label="Diet" className="input sm:w-44">
          <option value="">All diets</option>
          {DIETS.map((d) => (
            <option key={d} value={d}>{DIET_LABEL[d]}</option>
          ))}
        </select>
        <button className="btn-secondary">Search</button>
      </form>

      {dishes.length === 0 ? (
        <div className="surface p-8 text-center">
          <p className="text-lg font-semibold">{tab === "mine" ? "You haven't added any dishes yet" : "No dishes match"}</p>
          <p className="mt-1 text-ink-muted">
            {tab === "mine" ? "Add the dishes your family actually cooks. They'll show up first when you plan." : "Try a different search or diet."}
          </p>
          {tab === "mine" && <Link href="/dishes/new" className="btn-primary mt-4">Add your first dish</Link>}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dishes.map((d) => (
            <li key={d.id} className="flex">
              <div className="flex w-full [&>a]:w-full"><DishCard dish={d} mine={d.owner_id === userId} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
