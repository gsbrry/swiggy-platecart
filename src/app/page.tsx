import Link from "next/link";
import { CalendarDays, ListChecks, Share2, Store } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { MenuCard, type MenuCardData } from "@/components/menus/menu-card";
import { DietDot } from "@/components/ui/diet-dot";
import type { Diet, Period } from "@/lib/labels";
import { createClient, getUserId } from "@/lib/supabase/server";

export const metadata = {
  title: "Planetto — plan your week of meals, share it, copy great menus",
  description:
    "A free weekly meal planner for Indian homes. Plan breakfast, lunch and dinner, get a shopping list, share your week on WhatsApp, and copy menus from other cooks.",
};

const PREVIEW: [string, string, Diet][] = [
  ["Mon", "Moong Dal Chilla · Rajma Chawal · Paneer Bhurji", "veg"],
  ["Tue", "Idli Sambar · Curd Rice · Vegetable Khichdi", "veg"],
  ["Wed", "Masala Omelette · Dal Tadka · Egg Curry", "egg"],
  ["Thu", "Poha · Chole + Roti · Eating out", "veg"],
];

const STEPS = [
  { icon: CalendarDays, title: "Plan the week", body: "Tap a slot, pick a dish. Breakfast, lunch and dinner for seven days in a few minutes." },
  { icon: ListChecks, title: "Get the list", body: "Ingredients from every planned meal, added up for your household. Tick them off in the shop." },
  { icon: Share2, title: "Share it", body: "Send your week to family or your cook on WhatsApp with one link." },
  { icon: Store, title: "Copy a menu", body: "Short on ideas? Use a day, week or month planned by another home cook, and rate it." },
];

export default async function LandingPage() {
  const userId = await getUserId();
  const supabase = await createClient();
  const { data } = await supabase
    .from("menus")
    .select("slug, title, period, diet, tags, rating_avg, rating_count, get_count, owner:profiles!menus_owner_id_fkey(display_name)")
    .eq("visibility", "public")
    .eq("status", "active")
    .order("rating_avg", { ascending: false })
    .order("get_count", { ascending: false })
    .limit(3);
  const menus: MenuCardData[] = (data ?? []).map((m) => ({
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

  return (
    <div className="min-h-dvh">
      <header className="glass-strong sticky top-0 z-30 border-b border-hairline">
        <nav className="mx-auto flex h-16 max-w-app items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/market" className="btn-ghost btn-sm hidden sm:inline-flex">Browse menus</Link>
            {userId ? (
              <Link href="/plan" className="btn-primary btn-sm">Open my plan</Link>
            ) : (
              <>
                <Link href="/sign-in" className="btn-ghost btn-sm">Sign in</Link>
                <Link href="/sign-up" className="btn-primary btn-sm">Start free</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-app items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-orange">Free meal planner for Indian homes</p>
            <h1 className="mt-3 text-[40px] font-bold leading-[1.05] tracking-tight sm:text-[56px]">
              Decide the week once. <span className="text-accent">Not 21 times.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-muted">
              Plan breakfast, lunch and dinner for the whole week, get your shopping list, and share it with the family. Or copy a ready-made week from another home cook.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={userId ? "/plan" : "/sign-up"} className="btn-primary h-[52px] px-7 text-base">
                {userId ? "Open my plan" : "Plan my week, free"}
              </Link>
              <Link href="/market" className="btn-secondary h-[52px] px-7 text-base">See ready-made menus</Link>
            </div>
            <p className="mt-4 text-sm text-ink-muted">Veg, egg, non-veg, vegan and Jain. No credit card.</p>
          </div>

          <div className="glass p-5 sm:p-6" aria-hidden>
            <div className="flex items-center justify-between">
              <p className="font-semibold">This week</p>
              <span className="rounded-full bg-tint-orange px-2.5 py-1 text-xs font-semibold text-ink-orange">12 of 21 planned</span>
            </div>
            <ul className="mt-4 space-y-2">
              {PREVIEW.map(([day, meals, diet]) => (
                <li key={day} className="flex items-center gap-3 rounded-xl bg-white/90 px-3 py-3">
                  <span className="w-10 text-sm font-bold text-ink-orange">{day}</span>
                  <DietDot diet={diet} />
                  <span className="truncate text-sm">{meals}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl bg-white/90 px-3 py-3 text-sm">
              <p className="font-semibold">Shopping list · 18 items</p>
              <p className="text-ink-muted">toor dal 1.5 cup · paneer 300 g · curd 3 cup · …</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-app px-4 pb-16 sm:px-6" aria-labelledby="how">
          <h2 id="how" className="text-[28px] font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="surface p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[image:var(--action)] text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 text-sm font-semibold text-ink-muted">Step {i + 1}</p>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-ink-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {menus.length > 0 && (
          <section className="mx-auto max-w-app px-4 pb-16 sm:px-6" aria-labelledby="popular">
            <div className="flex items-end justify-between gap-4">
              <h2 id="popular" className="text-[28px] font-semibold">Popular menus</h2>
              <Link href="/market" className="font-semibold text-ink-orange hover:underline">See all →</Link>
            </div>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {menus.map((m) => (
                <li key={m.slug}><MenuCard menu={m} /></li>
              ))}
            </ul>
          </section>
        )}

        <section className="mx-auto max-w-app px-4 pb-20 sm:px-6">
          <div className="glass flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[28px] font-semibold">Sunday planning, done in ten minutes.</h2>
              <p className="mt-1 text-ink-muted">Free while we&apos;re in early access.</p>
            </div>
            <Link href={userId ? "/plan" : "/sign-up"} className="btn-primary h-[52px] px-7 text-base">Get started</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-app flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-muted sm:px-6">
          <span>© {new Date().getFullYear()} Planetto</span>
          <nav className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <Link href="/market" className="hover:text-ink">Market</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
