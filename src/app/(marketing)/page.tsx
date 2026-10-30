import Link from "next/link";
import { Check, Copy, MessageCircle, Plus, Star, Users, Utensils } from "lucide-react";

import { MenuCard, type MenuCardData } from "@/components/menus/menu-card";
import { DietDot } from "@/components/ui/diet-dot";
import { DIET_LABEL, DIETS, type Diet, type Meal, type Period } from "@/lib/labels";
import { createClient, getUserId } from "@/lib/supabase/server";

export const metadata = {
  title: "Planetto — plan your week of meals, share it, copy great menus",
  description:
    "A free weekly meal planner for Indian homes. Plan breakfast, lunch and dinner, get a shopping list sized for your family, share your week on WhatsApp, and copy menus from other home cooks.",
};

const HERO_WEEK: [string, string, Diet][] = [
  ["Mon", "Moong Dal Chilla · Rajma Chawal · Paneer Bhurji", "veg"],
  ["Tue", "Idli Sambar · Curd Rice · Vegetable Khichdi", "veg"],
  ["Wed", "Masala Omelette · Dal Tadka · Egg Curry", "egg"],
  ["Thu", "Poha · Chole + Roti · Eating out", "veg"],
];

const PAINS = [
  ["“What should we cook today?”", "asked three times a day, every day"],
  ["The same five dishes", "on repeat, because nobody had time to think"],
  ["Two trips to the shop", "for the coriander everyone forgot"],
  ["Ordering in at 9 pm", "because there was no plan for dinner"],
];

const FAQ: [string, string][] = [
  ["Is Planetto free?", "Yes. Planning, shopping lists, sharing and every menu in the Market are free. If paid menus from cooks arrive later, free menus stay free and you'll always see the price before you use anything."],
  ["Do I need to install an app?", "No. Planetto works in your phone's browser. On Android, tap the ⋮ menu and choose “Add to Home screen” to open it like an app."],
  ["Does it work for Jain, vegan or no onion-garlic food?", "Yes. Pick Veg, Eggetarian, Non-veg, Vegan or Jain, and list anything you never eat. The dish picker suggests what fits your kitchen first."],
  ["How does the shopping list know how much to buy?", "Every dish lists ingredients for two people. Planetto adds them up across the days you choose and scales them to your household size, so a family of four gets double."],
  ["Can my family see my plan?", "Only if you share it. Your plan is private. “Share” creates a link you can send on WhatsApp; anyone with the link can view it and copy it into their own week."],
  ["What is the Market?", "Ready-made day, week and month menus published by home cooks. Use one and it fills your calendar. Only people who have used a menu can rate it, so ratings stay honest."],
  ["What happens to my data?", "It's stored in India, used only to run Planetto, and never sold. Your diet and household details are private. You can delete your account and everything in it from the Me page at any time."],
  ["Who makes Planetto?", "Planetto is made in India, for Indian kitchens. The story and our promises are on the About page."],
];

export default async function LandingPage() {
  const userId = await getUserId();
  const supabase = await createClient();
  const [{ data: menus }, { data: dishes, count: dishCount }] = await Promise.all([
    supabase
      .from("menus")
      .select("id, slug, title, period, diet, tags, rating_avg, rating_count, get_count, owner:profiles!menus_owner_id_fkey(display_name)")
      .eq("visibility", "public")
      .eq("status", "active")
      .order("rating_avg", { ascending: false })
      .order("get_count", { ascending: false })
      .limit(3),
    supabase
      .from("dishes")
      .select("name, diet", { count: "exact" })
      .is("owner_id", null)
      .eq("status", "active")
      .order("name")
      .limit(60),
  ]);

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
    preview: [],
  }));

  const featured = menus?.[0];
  const { data: featuredItems } = featured
    ? await supabase.from("menu_items").select("day_index, meal, dish_name, is_eatout").eq("menu_id", featured.id).lte("day_index", 2)
    : { data: [] };
  const featuredDays = [0, 1, 2].map((d) =>
    (["breakfast", "lunch", "dinner"] as Meal[]).map((m) => {
      const it = (featuredItems ?? []).find((x) => x.day_index === d && x.meal === m);
      return it?.is_eatout ? "Eating out" : it?.dish_name ?? "—";
    }),
  );

  const startHref = userId ? "/today" : "/sign-up";

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-app grid-cols-[minmax(0,1fr)] items-center gap-10 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:pt-20">
        <div>
          <p className="text-sm font-semibold text-ink-orange">Free meal planner for Indian homes</p>
          <h1 className="mt-3 text-balance text-[40px] font-bold leading-[1.05] tracking-tight sm:text-[56px]">
            Decide the week once. <span className="text-accent">Not 21 times.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-muted">
            Plan breakfast, lunch and dinner for the whole week, get your shopping list, and share it with the family. Or copy a ready-made week from another home cook.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={startHref} className="btn-primary h-[52px] px-7 text-base">
              {userId ? "Go to my dashboard" : "Plan my week, free"}
            </Link>
            <Link href="/market" className="btn-secondary h-[52px] px-7 text-base">See ready-made menus</Link>
          </div>
          <p className="mt-4 text-sm text-ink-muted">Veg, egg, non-veg, vegan and Jain. Works in your phone&apos;s browser. No credit card.</p>
        </div>

        <div className="glass p-5 sm:p-6" aria-hidden>
          <div className="flex items-center justify-between">
            <p className="font-semibold">This week</p>
            <span className="rounded-full bg-tint-orange px-2.5 py-1 text-xs font-semibold text-ink-orange">12 of 21 planned</span>
          </div>
          <ul className="mt-4 space-y-2">
            {HERO_WEEK.map(([day, meals, diet], i) => (
              <li
                key={day}
                className="flex items-center gap-3 rounded-xl bg-white/90 px-3 py-3 motion-safe:animate-[plan-in_600ms_cubic-bezier(0.16,1,0.3,1)_both]"
                style={{ animationDelay: `${150 + i * 110}ms` }}
              >
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

      {/* Problem */}
      <section aria-labelledby="pain" className="border-y border-hairline bg-white/60">
        <div className="mx-auto grid max-w-app gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:py-20">
          <div>
            <h2 id="pain" className="text-balance text-[32px] font-semibold leading-tight sm:text-[40px]">Sound familiar?</h2>
            <p className="mt-4 max-w-md text-lg text-ink-muted">
              Cooking isn&apos;t the hard part. Deciding is. Ten minutes on Sunday fixes the whole week.
            </p>
          </div>
          <ul className="divide-y divide-hairline">
            {PAINS.map(([big, small]) => (
              <li key={big} className="flex flex-col gap-1 py-5 first:pt-0 sm:flex-row sm:items-baseline sm:gap-6">
                <span className="text-xl font-semibold sm:w-[46%] sm:shrink-0">{big}</span>
                <span className="text-ink-muted">{small}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Feature walkthrough */}
      <section aria-labelledby="how" className="mx-auto max-w-app space-y-20 px-4 py-20 sm:px-6 lg:space-y-28 lg:py-28">
        <h2 id="how" className="sr-only">How Planetto works</h2>

        <Feature
          step="Plan"
          title="Your whole week on one screen"
          body="Tap an empty slot, search a dish or type your own. Mark nights you're eating out. Next Sunday, copy last week in one tap and change only what you want."
          points={["Breakfast, lunch and dinner for 7 days", "47 starter dishes, plus your own recipes", "A single-day view that fits your phone"]}
        >
          <WeekMock />
        </Feature>

        <Feature
          reverse
          step="Shop"
          title="The shopping list writes itself"
          body="Planetto adds up the ingredients of every planned meal and scales them for your household. Tick things off in the shop, or send the list to whoever is going."
          points={["Today, the rest of the week, or the next 7 days", "Quantities sized for 1 to 12 people", "Send on WhatsApp in one tap"]}
        >
          <ListMock />
        </Feature>

        <Feature
          step="Share"
          title="Send the week to the family"
          body="Share creates a link with a preview of your week. Family, flatmates or your cook open it without signing up, and can copy it into their own plan."
          points={["Private by default", "A link anyone can open, or listed in the Market", "Copy as plain text if you prefer"]}
        >
          <ShareMock />
        </Feature>

        <Feature
          reverse
          step="Copy"
          title="Borrow a week from another kitchen"
          body="Short on ideas? The Market has day, week and month menus planned by home cooks. Use one and your calendar fills up. Keep the meals you've already planned, or replace them."
          points={["Filter by diet and length", "Ratings only from people who used the menu", "Rate what worked so others can find it"]}
        >
          {featured ? <FeaturedMock title={featured.title} rating={Number(featured.rating_avg)} count={featured.rating_count} days={featuredDays} /> : <WeekMock />}
        </Feature>
      </section>

      {/* Indian kitchens */}
      <section aria-labelledby="kitchens" className="border-y border-hairline bg-white/60">
        <div className="mx-auto max-w-app px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <h2 id="kitchens" className="text-balance text-[32px] font-semibold leading-tight sm:text-[40px]">Made for Indian kitchens</h2>
              <p className="mt-4 max-w-md text-lg text-ink-muted">
                Recipe apps assume onion, garlic and an oven. Planetto starts from dal, sabzi and roti, and respects how your family eats.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {DIETS.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white px-3 py-1.5 text-sm font-medium">
                    <DietDot diet={d} /> {DIET_LABEL[d]}
                  </span>
                ))}
                {["No onion", "No garlic", "No mushroom"].map((x) => (
                  <span key={x} className="rounded-full border border-dashed border-hairline px-3 py-1.5 text-sm text-ink-muted">{x}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-muted">
                {dishCount ?? dishes?.length ?? 0} starter dishes in the library, from Kerala to Punjab
              </p>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Some dishes in the library">
                {(dishes ?? []).slice(0, 28).map((d) => (
                  <li key={d.name} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-sm shadow-[0_1px_2px_rgb(43_29_26/0.06)]">
                    <DietDot diet={d.diet as Diet} /> {d.name}
                  </li>
                ))}
              </ul>
              <Link href="/dishes" className="btn-ghost btn-sm mt-4 !px-0">Browse all dishes →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular menus */}
      {cards.length > 0 && (
        <section className="mx-auto max-w-app px-4 py-20 sm:px-6" aria-labelledby="popular">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="popular" className="text-[32px] font-semibold leading-tight">Popular menus right now</h2>
              <p className="mt-2 text-ink-muted">Free to use. Open one to see every day.</p>
            </div>
            <Link href="/market" className="hidden font-semibold text-ink-orange hover:underline sm:block">See all menus →</Link>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((m) => (
              <li key={m.slug}><MenuCard menu={m} /></li>
            ))}
          </ul>
          <Link href="/market" className="btn-secondary mt-6 sm:hidden">See all menus</Link>
        </section>
      )}

      {/* Creators */}
      <section aria-labelledby="cooks" className="mx-auto max-w-app px-4 pb-20 sm:px-6">
        <div className="glass grid gap-8 p-8 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h2 id="cooks" className="text-balance text-[28px] font-semibold leading-tight sm:text-[36px]">You already plan a great week. Share it.</h2>
            <p className="mt-3 max-w-xl text-lg text-ink-muted">
              Nutritionists, fitness coaches, Jain home cooks, the friend everyone asks for ideas: publish your week and let others copy it, rate it and come back for more.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/creators" className="btn-primary h-[52px] px-7 text-base">How publishing works</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-h" className="scroll-mt-20 border-t border-hairline bg-white/60">
        <div className="mx-auto grid max-w-app gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:py-20">
          <div>
            <h2 id="faq-h" className="text-[32px] font-semibold leading-tight sm:text-[40px]">Questions</h2>
            <p className="mt-3 text-ink-muted">
              Something else? Write to <a className="font-medium text-ink-orange underline" href="mailto:hello@obio.in">hello@obio.in</a>.
            </p>
          </div>
          <div className="divide-y divide-hairline border-y border-hairline">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-1">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                  {q}
                  <Plus aria-hidden className="h-5 w-5 shrink-0 text-ink-orange transition-transform group-open:rotate-45" />
                </summary>
                <p className="max-w-[65ch] pb-5 text-ink-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-app px-4 py-20 sm:px-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-balance text-[32px] font-semibold leading-tight sm:text-[40px]">Sunday planning, done in ten minutes.</h2>
            <p className="mt-2 text-lg text-ink-muted">Free while we&apos;re in early access.</p>
          </div>
          <Link href={startHref} className="btn-primary h-[52px] shrink-0 px-8 text-base">
            {userId ? "Go to my dashboard" : "Plan my first week"}
          </Link>
        </div>
      </section>
    </>
  );
}

function Feature({
  step,
  title,
  body,
  points,
  reverse = false,
  children,
}: {
  step: string;
  title: string;
  body: string;
  points: string[];
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={reverse ? "lg:order-2" : ""}>
        <p className="text-sm font-semibold text-ink-orange">{step}</p>
        <h3 className="mt-2 text-balance text-[28px] font-semibold leading-tight sm:text-[36px]">{title}</h3>
        <p className="mt-4 max-w-[60ch] text-lg text-ink-muted">{body}</p>
        <ul className="mt-6 space-y-2.5">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2.5">
              <Check aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={reverse ? "lg:order-1" : ""} aria-hidden>
        {children}
      </div>
    </div>
  );
}

/* ——— Illustrations built from the real UI vocabulary (decorative, aria-hidden) ——— */

function WeekMock() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const grid: (string | null)[][] = [
    ["Poha", "Upma", "Idli", "Chilla", "Thepla", "Paratha", null],
    ["Dal Tadka", "Rajma", "Curd Rice", "Chole", null, "Kadhi", "Biryani"],
    ["Paneer", "Aloo Gobi", "Khichdi", "Matar", "out", "Palak", null],
  ];
  return (
    <div className="surface-solid overflow-hidden p-0">
      <div className="grid grid-cols-7 border-b border-hairline text-center text-[11px] font-semibold uppercase text-ink-muted">
        {days.map((d, i) => (
          <span key={d} className={`py-2 ${i === 3 ? "bg-tint-orange text-ink-orange" : ""}`}>{d}</span>
        ))}
      </div>
      {grid.map((row, r) => (
        <div key={r} className="grid grid-cols-7 border-b border-hairline last:border-b-0">
          {row.map((cell, c) => (
            <div key={c} className={`flex h-16 items-center justify-center border-l border-hairline p-1 text-center text-[11px] font-semibold leading-tight first:border-l-0 sm:h-20 sm:text-xs ${c === 3 ? "bg-tint-orange/50" : ""}`}>
              {cell === null ? (
                <span className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-hairline text-ink-faint">
                  <Plus className="h-3.5 w-3.5" />
                </span>
              ) : cell === "out" ? (
                <Utensils className="h-4 w-4 text-ink-orange" />
              ) : (
                cell
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ListMock() {
  const items: [string, string, boolean][] = [
    ["Toor dal", "3 cup", true],
    ["Paneer", "400 g", false],
    ["Curd", "4 cup", false],
    ["Tomato", "10 pc", true],
    ["Coriander", "1 bunch", false],
  ];
  return (
    <div className="surface-solid p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Rest of this week</p>
        <span className="text-sm text-ink-muted">for 4 people</span>
      </div>
      <ul className="mt-3 divide-y divide-hairline">
        {items.map(([name, qty, done]) => (
          <li key={name} className="flex items-center gap-3 py-3">
            <span className={`flex h-5 w-5 items-center justify-center rounded border ${done ? "border-transparent bg-[var(--ink-orange)] text-white" : "border-[rgb(43_29_26/0.25)]"}`}>
              {done && <Check className="h-3.5 w-3.5" />}
            </span>
            <span className={`flex-1 ${done ? "text-ink-faint line-through" : "font-medium"}`}>{name}</span>
            <span className={done ? "text-ink-faint" : "font-semibold"}>{qty}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <span className="btn-secondary btn-sm pointer-events-none"><Copy className="h-4 w-4" /> Copy list</span>
        <span className="btn-secondary btn-sm pointer-events-none"><MessageCircle className="h-4 w-4" /> WhatsApp</span>
      </div>
    </div>
  );
}

function ShareMock() {
  return (
    <div className="mx-auto max-w-sm rounded-[28px] bg-[#e7ddd3] p-4 shadow-[0_24px_48px_rgb(43_29_26/0.12)]">
      <p className="mb-3 text-center text-xs text-[#6b5e55]">Family 🏠</p>
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] p-2 shadow-sm">
        <div className="overflow-hidden rounded-xl bg-white">
          <div className="bg-[linear-gradient(135deg,#fff6ef,#ffd9c4)] p-4">
            <p className="text-[11px] font-bold uppercase text-ink-orange">Week menu · Veg</p>
            <p className="mt-1 text-lg font-bold leading-tight">Our week · 2 – 8 Nov</p>
            <p className="mt-1 text-xs text-ink-muted">Poha · Rajma Chawal · Paneer Bhurji</p>
          </div>
          <p className="px-3 py-2 text-xs text-ink-muted">planetto.obio.in</p>
        </div>
        <p className="px-1 pt-1.5 text-sm">This week&apos;s plan 👆 tell me if you want changes</p>
        <p className="text-right text-[10px] text-[#6b5e55]">8:02 pm ✓✓</p>
      </div>
      <div className="mt-2 max-w-[70%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm shadow-sm">
        Rajma on Tuesday please 🙏
        <p className="text-right text-[10px] text-[#6b5e55]">8:05 pm</p>
      </div>
    </div>
  );
}

function FeaturedMock({ title, rating, count, days }: { title: string; rating: number; count: number; days: string[][] }) {
  return (
    <div className="surface-solid p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-ink-orange">From the Market</p>
          <p className="mt-1 text-xl font-semibold">{title}</p>
        </div>
        {count > 0 && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold">
            <Star className="h-4 w-4 fill-[#E0A100] text-[#E0A100]" /> {rating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {days.map((meals, i) => (
          <div key={i} className="rounded-lg bg-fill-subtle p-3">
            <p className="text-xs font-semibold text-ink-orange">Day {i + 1}</p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {meals.map((m, j) => (
                <li key={j} className="truncate">{m}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-sm text-ink-muted"><Users className="h-4 w-4" /> Copy into your week</span>
        <span className="btn-primary btn-sm pointer-events-none">Use this menu</span>
      </div>
    </div>
  );
}
