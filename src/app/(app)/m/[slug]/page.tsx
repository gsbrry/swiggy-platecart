import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2, Users, Utensils } from "lucide-react";

import { ReportButton } from "@/components/dishes/dish-actions";
import { GetMenuButton, RateForm, ShareButtons, VisibilityControl } from "@/components/menus/menu-actions";
import { DietDot } from "@/components/ui/diet-dot";
import { Stars } from "@/components/ui/stars";
import { deleteMenu } from "@/lib/actions/menus";
import { addDays, mondayOf, todayIso } from "@/lib/dates";
import { DIET_LABEL, HEALTH_TAGS, MEAL_LABEL, MEALS, PERIOD_LABEL } from "@/lib/labels";
import { loadMenu, type MenuItem } from "@/lib/menus";
import { createClient, getUserId } from "@/lib/supabase/server";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadMenu(slug);
  if (!data) return { title: "Menu not found" };
  const description =
    data.menu.description ?? `A ${PERIOD_LABEL[data.menu.period].toLowerCase()} of ${DIET_LABEL[data.menu.diet].toLowerCase()} meals by ${data.owner.display_name}.`;
  return {
    title: data.menu.title,
    description,
    // Link-only menus stay out of search engines.
    robots: data.menu.visibility === "public" ? undefined : { index: false, follow: false },
    openGraph: { title: data.menu.title, description, type: "article" },
  };
}

export default async function MenuPage({ params }: Params) {
  const { slug } = await params;
  const data = await loadMenu(slug);
  if (!data) notFound();
  const { menu, owner, is_owner, items } = data;
  const userId = await getUserId();
  const supabase = await createClient();

  const [{ data: ratings }, { data: acquired }] = await Promise.all([
    supabase
      .from("menu_ratings")
      .select("id, stars, review, created_at, user_id, author:profiles(display_name)")
      .eq("menu_id", menu.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50),
    userId
      ? supabase.from("menu_acquisitions").select("start_date").eq("menu_id", menu.id).eq("user_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const mine = (ratings ?? []).find((r) => r.user_id === userId);
  const today = todayIso();
  const nextMonday = addDays(mondayOf(today), 7);

  const byDay = new Map<number, MenuItem[]>();
  for (const it of items) byDay.set(it.day_index, [...(byDay.get(it.day_index) ?? []), it]);
  const dayCount = menu.days;

  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <header className="glass space-y-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
          <span className="inline-flex items-center gap-1.5"><DietDot diet={menu.diet} /> {DIET_LABEL[menu.diet]}</span>
          <span>·</span>
          <span className="rounded-full bg-tint-orange px-2 py-0.5 font-semibold text-ink-orange">{PERIOD_LABEL[menu.period]} menu</span>
          {menu.tags.map((t) => (
            <span key={t} className="rounded-full bg-white/80 px-2 py-0.5">{t}</span>
          ))}
        </div>
        <h1 className="text-[28px] font-semibold leading-tight sm:text-[40px]">{menu.title}</h1>
        <p className="text-ink-muted">
          by <span className="font-semibold text-ink">{owner.display_name}</span>
          {owner.username && <> · @{owner.username}</>}
        </p>
        {menu.description && <p className="max-w-2xl whitespace-pre-line">{menu.description}</p>}
        {menu.tags.some((t) => HEALTH_TAGS.includes(t)) && (
          <p className="max-w-2xl text-sm text-ink-muted">
            General food ideas, not medical or diet advice. If you have a health condition, are pregnant, or follow a strict diet like keto, check with a doctor or dietitian first.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <Stars value={Number(menu.rating_avg)} count={menu.rating_count} size="md" />
          <span className="inline-flex items-center gap-1 text-sm text-ink-muted">
            <Users className="h-4 w-4" /> {menu.get_count} {menu.get_count === 1 ? "person has" : "people have"} used this
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <GetMenuButton slug={menu.slug} period={menu.period} today={today} nextMonday={nextMonday} signedIn={!!userId} />
          <ShareButtons slug={menu.slug} title={menu.title} />
        </div>
        {is_owner && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
            <VisibilityControl menuId={menu.id} slug={menu.slug} value={menu.visibility} />
            <form action={deleteMenu}>
              <input type="hidden" name="id" value={menu.id} />
              <button className="btn-ghost btn-sm text-danger hover:bg-danger/5"><Trash2 className="h-4 w-4" /> Delete menu</button>
            </form>
          </div>
        )}
      </header>

      <section aria-labelledby="days-h" className="space-y-3">
        <h2 id="days-h" className="text-[22px] font-semibold">What&apos;s in it</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: dayCount }, (_, d) => (
            <li key={d} className="surface-solid p-4">
              <p className="text-sm font-semibold text-ink-orange">
                {menu.period === "day" ? "The day" : `Day ${d + 1}`}
                {menu.period === "month" && d % 7 === 0 && <span className="ml-2 text-ink-muted">· Week {d / 7 + 1}</span>}
              </p>
              <ul className="mt-2 space-y-1.5">
                {MEALS.map((m) => {
                  const it = byDay.get(d)?.find((x) => x.meal === m);
                  return (
                    <li key={m} className="flex gap-2 text-[15px]">
                      <span className="w-20 shrink-0 text-sm text-ink-muted">{MEAL_LABEL[m]}</span>
                      {it?.is_eatout ? (
                        <span className="inline-flex items-center gap-1 text-ink-muted"><Utensils className="h-3.5 w-3.5" /> Eating out</span>
                      ) : it?.dish_name ? (
                        <span className="inline-flex items-start gap-1.5 font-medium">
                          {it.dish_diet && it.dish_diet !== menu.diet && <DietDot diet={it.dish_diet} className="mt-1" />}
                          {it.dish_name}
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="reviews-h" className="space-y-3">
        <h2 id="reviews-h" className="text-[22px] font-semibold">Ratings</h2>
        {userId && !is_owner && acquired && (
          <RateForm menuId={menu.id} slug={menu.slug} initialStars={mine?.stars ?? 0} initialReview={mine?.review ?? ""} />
        )}
        {userId && !is_owner && !acquired && (
          <p className="text-sm text-ink-muted">Use this menu to rate it. Only people who used a menu can rate it, so ratings stay honest.</p>
        )}
        {(ratings ?? []).length === 0 ? (
          <p className="text-ink-muted">No ratings yet.</p>
        ) : (
          <ul className="space-y-2">
            {(ratings ?? []).map((r) => (
              <li key={r.id} className="surface-solid p-4">
                <div className="flex items-center justify-between gap-2">
                  <Stars value={r.stars} />
                  <span className="text-xs text-ink-muted">{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                {r.review && <p className="mt-2 whitespace-pre-line">{r.review}</p>}
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-sm text-ink-muted">{r.author?.display_name ?? "A Planetto cook"}</p>
                  {userId && r.user_id !== userId && <ReportButton type="rating" id={r.id} signedIn />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!is_owner && <ReportButton type="menu" id={menu.id} signedIn={!!userId} />}
    </article>
  );
}
