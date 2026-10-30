import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Plus, Share2, ShoppingBasket, Star, Store, Users, Utensils } from "lucide-react";

import { MenuCard, type MenuCardData } from "@/components/menus/menu-card";
import { DietDot } from "@/components/ui/diet-dot";
import { getMe } from "@/lib/auth";
import { addDays, formatDay, todayIso, weekDates, weekStartOf } from "@/lib/dates";
import { DIET_ALLOWS, MEAL_LABEL, MEALS, type Diet, type Meal, type Period } from "@/lib/labels";
import { buildShoppingList, type Line } from "@/lib/shopping";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Today" };

function greeting(now = new Date()): string {
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(now));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type SlotRow = {
  date: string;
  meal: string;
  is_eatout: boolean;
  dish: { id: string; name: string; diet: string; cook_minutes: number | null; dish_ingredients: Line[] } | null;
};

export default async function TodayPage() {
  const me = await getMe();
  if (!me) redirect("/sign-in?next=/today");
  if (!me.settings.onboarded) redirect("/onboarding");

  const today = todayIso();
  const tomorrow = addDays(today, 1);
  const start = weekStartOf(today, me.settings.week_start);
  const days = weekDates(start);
  const diet = (me.settings.diet ?? "veg") as Diet;

  const supabase = await createClient();
  const [{ data: slotData }, { data: myMenus }, { data: suggested }] = await Promise.all([
    supabase
      .from("plan_slots")
      .select("date, meal, is_eatout, dish:dishes(id, name, diet, cook_minutes, dish_ingredients(name, quantity, unit))")
      .eq("user_id", me.id)
      .gte("date", days[0])
      .lte("date", addDays(days[6], 1)),
    supabase.from("menus").select("get_count, rating_avg, rating_count").eq("owner_id", me.id),
    supabase
      .from("menus")
      .select("slug, title, period, diet, tags, rating_avg, rating_count, get_count, owner:profiles!menus_owner_id_fkey(display_name)")
      .eq("visibility", "public")
      .eq("status", "active")
      .eq("period", "week")
      .in("diet", DIET_ALLOWS[diet])
      .order("rating_avg", { ascending: false })
      .limit(3),
  ]);

  const slots = (slotData ?? []) as unknown as SlotRow[];
  const at = (date: string, meal: Meal) => slots.find((s) => s.date === date && s.meal === meal);
  const weekFilled = slots.filter((s) => s.date >= days[0] && s.date <= days[6] && (s.dish || s.is_eatout)).length;
  const rest = slots.filter((s) => s.date >= today && s.date <= days[6] && s.dish);
  const listCount = buildShoppingList(
    rest.map((s) => ({ dish: s.dish!.name, ingredients: s.dish!.dish_ingredients ?? [] })),
    me.settings.household_size,
  ).length;
  const uses = (myMenus ?? []).reduce((n, m) => n + m.get_count, 0);
  const rated = (myMenus ?? []).filter((m) => m.rating_count > 0);
  const avg = rated.length ? rated.reduce((n, m) => n + Number(m.rating_avg), 0) / rated.length : 0;

  const cards: MenuCardData[] = (suggested ?? []).map((m) => ({
    slug: m.slug,
    title: m.title,
    period: m.period as Period,
    diet: m.diet as Diet,
    tags: m.tags,
    rating_avg: Number(m.rating_avg),
    rating_count: m.rating_count,
    get_count: m.get_count,
    author: m.owner?.display_name ?? "Planetto Kitchen",
    preview: [],
  }));

  const first = me.profile.display_name.split(" ")[0];
  const pct = Math.round((weekFilled / 21) * 100);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-ink-orange">{formatDay(today, { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="mt-1 text-[28px] font-semibold leading-tight sm:text-[36px]">
          {greeting()}, {first}
        </h1>
      </header>

      {/* Today's meals: the signature glass element on this screen */}
      <section aria-labelledby="today-h" className="glass p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id="today-h" className="text-lg font-semibold">On the menu today</h2>
          <Link href={`/plan?w=${today}`} className="text-sm font-semibold text-ink-orange hover:underline">Edit plan</Link>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {MEALS.map((m) => {
            const s = at(today, m);
            return (
              <li key={m}>
                {s?.dish ? (
                  <Link href={`/dishes/${s.dish.id}`} className="flex h-full flex-col rounded-xl bg-white p-4 transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange">
                    <span className="text-xs font-semibold uppercase text-ink-muted">{MEAL_LABEL[m]}</span>
                    <span className="mt-1.5 flex items-start gap-1.5 text-lg font-semibold leading-snug">
                      <DietDot diet={s.dish.diet as Diet} className="mt-1.5" /> {s.dish.name}
                    </span>
                    {s.dish.cook_minutes && <span className="mt-auto pt-2 text-sm text-ink-muted">{s.dish.cook_minutes} min · see recipe</span>}
                  </Link>
                ) : s?.is_eatout ? (
                  <div className="flex h-full flex-col rounded-xl bg-white p-4">
                    <span className="text-xs font-semibold uppercase text-ink-muted">{MEAL_LABEL[m]}</span>
                    <span className="mt-1.5 flex items-center gap-1.5 text-lg font-semibold text-ink-orange">
                      <Utensils className="h-4 w-4" /> Eating out
                    </span>
                  </div>
                ) : (
                  <Link href={`/plan?w=${today}`} className="flex h-full min-h-[96px] flex-col justify-center rounded-xl border border-dashed border-[rgb(43_29_26/0.2)] bg-white/60 p-4 text-ink-muted transition hover:border-[var(--ink-orange)] hover:text-ink-orange">
                    <span className="text-xs font-semibold uppercase">{MEAL_LABEL[m]}</span>
                    <span className="mt-1 inline-flex items-center gap-1 font-semibold"><Plus className="h-4 w-4" /> Add a dish</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-sm text-ink-muted">
          Tomorrow:{" "}
          {MEALS.map((m) => {
            const s = at(tomorrow, m);
            return s?.dish ? s.dish.name : s?.is_eatout ? "eating out" : null;
          })
            .filter(Boolean)
            .join(" · ") || "nothing planned yet"}
        </p>
      </section>

      {/* At a glance */}
      <section aria-label="This week at a glance" className="grid gap-3 sm:grid-cols-3">
        <Link href="/plan" className="surface-solid group flex flex-col gap-3 p-5 transition hover:shadow-md">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink-muted"><CalendarDays className="h-4 w-4" /> This week</span>
          <span className="text-2xl font-bold">{weekFilled} of 21 meals</span>
          <span className="h-2 overflow-hidden rounded-full bg-fill-subtle" aria-hidden>
            <span className="block h-full rounded-full bg-[image:var(--action)]" style={{ width: `${pct}%` }} />
          </span>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-ink-orange">
            {weekFilled < 21 ? "Finish planning" : "View the week"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
        <Link href="/list" className="surface-solid group flex flex-col gap-3 p-5 transition hover:shadow-md">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink-muted"><ShoppingBasket className="h-4 w-4" /> Shopping list</span>
          <span className="text-2xl font-bold">{listCount} {listCount === 1 ? "item" : "items"}</span>
          <span className="text-sm text-ink-muted">for the rest of this week, {me.settings.household_size} {me.settings.household_size === 1 ? "person" : "people"}</span>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-ink-orange">
            Open list <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
        <Link href="/me#menus" className="surface-solid group flex flex-col gap-3 p-5 transition hover:shadow-md">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink-muted"><Share2 className="h-4 w-4" /> Your menus</span>
          <span className="text-2xl font-bold">{(myMenus ?? []).length} shared</span>
          <span className="flex items-center gap-3 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {uses} uses</span>
            {rated.length > 0 && <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-[#E0A100] text-[#E0A100]" /> {avg.toFixed(1)}</span>}
          </span>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-ink-orange">
            {(myMenus ?? []).length ? "See your menus" : "Share your first week"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>

      {/* Quick actions */}
      <section aria-label="Quick actions" className="flex flex-wrap gap-2">
        <Link href="/plan" className="btn-secondary btn-sm"><CalendarDays className="h-4 w-4" /> Plan the week</Link>
        <Link href="/dishes/new" className="btn-secondary btn-sm"><Plus className="h-4 w-4" /> Add a dish</Link>
        <Link href="/dishes" className="btn-secondary btn-sm">Browse dishes</Link>
        <Link href="/market" className="btn-secondary btn-sm"><Store className="h-4 w-4" /> Browse menus</Link>
      </section>

      {cards.length > 0 && (
        <section aria-labelledby="ideas" className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="ideas" className="text-[22px] font-semibold">Ideas for next week</h2>
              <p className="text-sm text-ink-muted">Top-rated weeks that fit your diet.</p>
            </div>
            <Link href="/market" className="text-sm font-semibold text-ink-orange hover:underline">More menus</Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <li key={c.slug}><MenuCard menu={c} /></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
