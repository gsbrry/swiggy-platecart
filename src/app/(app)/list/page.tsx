import Link from "next/link";
import { redirect } from "next/navigation";

import { ShoppingList } from "@/components/list/shopping-list";
import { getMe } from "@/lib/auth";
import { addDays, formatDay, todayIso, weekStartOf } from "@/lib/dates";
import { buildShoppingList, type Line } from "@/lib/shopping";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Shopping list" };

const RANGES = {
  today: "Today",
  week: "Rest of this week",
  next7: "Next 7 days",
} as const;
type Range = keyof typeof RANGES;

export default async function ListPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const me = await getMe();
  if (!me) redirect("/sign-in?next=/list");
  const { range: r } = await searchParams;
  const range: Range = r && r in RANGES ? (r as Range) : "week";
  const today = todayIso();
  const end = range === "today" ? today : range === "week" ? addDays(weekStartOf(today, me.settings.week_start), 6) : addDays(today, 6);

  const supabase = await createClient();
  const { data } = await supabase
    .from("plan_slots")
    .select("date, dish:dishes(name, dish_ingredients(name, quantity, unit))")
    .eq("user_id", me.id)
    .gte("date", today)
    .lte("date", end)
    .not("dish_id", "is", null);

  const meals = (data ?? [])
    .filter((s) => s.dish)
    .map((s) => ({ dish: s.dish!.name, ingredients: (s.dish!.dish_ingredients ?? []) as Line[] }));
  const items = buildShoppingList(meals, me.settings.household_size);
  const label = `${formatDay(today, { day: "numeric", month: "short" })}${end !== today ? ` – ${formatDay(end, { day: "numeric", month: "short" })}` : ""}`;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-[28px] font-semibold leading-tight">Shopping list</h1>
        <p className="text-ink-muted">
          {label} · {meals.length} meals · for {me.settings.household_size} {me.settings.household_size === 1 ? "person" : "people"}{" "}
          <Link href="/me#preferences" className="text-ink-orange hover:underline">change</Link>
        </p>
      </div>
      <nav aria-label="Range" className="flex flex-wrap gap-2">
        {(Object.keys(RANGES) as Range[]).map((k) => (
          <Link key={k} href={`/list?range=${k}`} className="chip" aria-current={k === range ? "page" : undefined}>
            {RANGES[k]}
          </Link>
        ))}
      </nav>
      {items.length === 0 ? (
        <div className="surface p-8 text-center">
          <p className="text-lg font-semibold">Nothing to buy yet</p>
          <p className="mt-1 text-ink-muted">
            {meals.length === 0 ? "Plan some meals and their ingredients will show up here." : "The planned dishes don't have ingredients yet. Add them on the dish page."}
          </p>
          <Link href="/plan" className="btn-primary mt-4">Go to plan</Link>
        </div>
      ) : (
        <ShoppingList items={items} storageKey={`planetto:list:${today}:${end}`} title={`Shopping list (${label})`} />
      )}
    </div>
  );
}
