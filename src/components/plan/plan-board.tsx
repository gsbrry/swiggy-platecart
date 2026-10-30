"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, ClipboardList, Copy, Plus, Share2, Store, Utensils, X } from "lucide-react";

import { DishPicker } from "@/components/plan/dish-picker";
import { ShareSheet } from "@/components/plan/share-sheet";
import type { DishOption, PlanSlot } from "@/components/plan/types";
import { DietDot } from "@/components/ui/diet-dot";
import { useToast } from "@/components/ui/toast";
import { clearSlot, copyPreviousWeek } from "@/lib/actions/plan";
import { formatDay, weekDates, weekLabel } from "@/lib/dates";
import { MEAL_LABEL, MEALS, type Diet, type Meal } from "@/lib/labels";

type Props = {
  monday: string;
  today: string;
  prevWeek: string;
  nextWeek: string;
  slots: PlanSlot[];
  dishes: DishOption[];
  diet: Diet;
  /** Meals just added from a menu (from /m/[slug] "Use this menu"). */
  added: number | null;
};

export function PlanBoard({ monday, today, prevWeek, nextWeek, slots, dishes, diet, added }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const days = weekDates(monday);
  const inThisWeek = days.includes(today);
  const [selectedDay, setSelectedDay] = useState(inThisWeek ? today : days[0]);
  const [picker, setPicker] = useState<{ date: string; meal: Meal } | null>(null);
  const [sharing, setSharing] = useState(false);

  const byKey = useMemo(() => {
    const m = new Map<string, PlanSlot>();
    for (const s of slots) m.set(`${s.date}|${s.meal}`, s);
    return m;
  }, [slots]);
  const filled = slots.filter((s) => s.dish || s.isEatout).length;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success?: string) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) toast(res.error ?? "Something went wrong.", "error");
      else if (success) toast(success);
      router.refresh();
    });
  }

  function planAsText(): string {
    const lines = [`My meal plan · ${weekLabel(monday)}`];
    for (const d of days) {
      const parts = MEALS.map((m) => {
        const s = byKey.get(`${d}|${m}`);
        return s?.dish ? `${MEAL_LABEL[m]}: ${s.dish.name}` : s?.isEatout ? `${MEAL_LABEL[m]}: eating out` : null;
      }).filter(Boolean);
      if (parts.length) lines.push(`\n${formatDay(d, { weekday: "long", day: "numeric", month: "short" })}\n${parts.join("\n")}`);
    }
    lines.push("\nPlanned with Planetto");
    return lines.join("\n");
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(planAsText());
      toast("Plan copied. Paste it in WhatsApp.");
    } catch {
      toast("Couldn't copy. Your browser blocked the clipboard.", "error");
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Link href={`/plan?w=${prevWeek}`} className="btn-secondary h-11 w-11 !px-0" aria-label="Previous week">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="px-2">
            <h1 className="text-[22px] font-semibold leading-tight sm:text-[28px]">{weekLabel(monday)}</h1>
            <p className="text-sm text-ink-muted">
              {inThisWeek ? "This week" : <Link href="/plan" className="font-medium text-ink-orange hover:underline">Back to this week</Link>}
              {" · "}
              {filled}/21 meals planned
            </p>
          </div>
          <Link href={`/plan?w=${nextWeek}`} className="btn-secondary h-11 w-11 !px-0" aria-label="Next week">
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
        <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
          <button type="button" className="btn-secondary btn-sm !gap-1.5 whitespace-nowrap !px-2 text-[13px] sm:!px-4 sm:text-sm" disabled={pending} onClick={() => run(() => copyPreviousWeek({ monday }), "Copied last week into the empty slots.")}>
            <Copy className="h-4 w-4 shrink-0" /> <span className="sm:hidden">Last week</span><span className="hidden sm:inline">Copy last week</span>
          </button>
          <button type="button" className="btn-secondary btn-sm !gap-1.5 whitespace-nowrap !px-2 text-[13px] sm:!px-4 sm:text-sm" onClick={copyText} disabled={filled === 0}>
            <ClipboardList className="h-4 w-4 shrink-0" /> <span className="sm:hidden">As text</span><span className="hidden sm:inline">Copy as text</span>
          </button>
          <button type="button" className="btn-primary btn-sm !gap-1.5 whitespace-nowrap !px-2 text-[13px] sm:!px-4 sm:text-sm" onClick={() => setSharing(true)} disabled={filled === 0}>
            <Share2 className="h-4 w-4 shrink-0" /> Share
          </button>
        </div>
      </div>

      {added !== null && (
        <p role="status" className="rounded-xl border border-success/30 bg-white px-4 py-3 text-success">
          {added === 0
            ? "Those days were already planned, so nothing changed. Choose “Replace them” to overwrite."
            : `Added ${added} ${added === 1 ? "meal" : "meals"} from the menu. Ingredients are on your shopping list.`}
        </p>
      )}

      {filled === 0 && (
        <div className="glass flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold">Your week is empty</p>
            <p className="text-ink-muted">Start from a ready-made menu, or tap any slot to add a dish.</p>
          </div>
          <Link href="/market" className="btn-primary">
            <Store className="h-4 w-4" /> Browse menus
          </Link>
        </div>
      )}

      {/* Mobile: day strip + day list */}
      <div className="lg:hidden">
        <div role="tablist" aria-label="Day" className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const count = MEALS.filter((m) => {
              const s = byKey.get(`${d}|${m}`);
              return s?.dish || s?.isEatout;
            }).length;
            const active = d === selectedDay;
            return (
              <button
                key={d}
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedDay(d)}
                className={`flex flex-col items-center rounded-xl border px-0 py-2 transition ${
                  active ? "border-transparent bg-[image:var(--action)] text-white" : "border-hairline bg-white text-ink"
                }`}
              >
                <span className={`text-[11px] font-semibold uppercase ${active ? "text-white/90" : "text-ink-muted"}`}>
                  {formatDay(d, { weekday: "short" })}
                </span>
                <span className="text-lg font-bold leading-tight">{formatDay(d, { day: "numeric" })}</span>
                <span className="mt-0.5 flex gap-0.5" aria-label={`${count} of 3 planned`}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`h-1 w-1 rounded-full ${i < count ? (active ? "bg-white" : "bg-[var(--ink-orange)]") : active ? "bg-white/40" : "bg-hairline"}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 space-y-3">
          <h2 className="text-lg font-semibold">
            {formatDay(selectedDay, { weekday: "long", day: "numeric", month: "long" })}
            {selectedDay === today && <span className="ml-2 align-middle text-sm font-semibold text-ink-orange">Today</span>}
          </h2>
          {MEALS.map((m) => (
            <SlotCard
              key={m}
              meal={m}
              slot={byKey.get(`${selectedDay}|${m}`)}
              onPick={() => setPicker({ date: selectedDay, meal: m })}
              onClear={() => run(() => clearSlot({ date: selectedDay, meal: m }))}
              disabled={pending}
              large
            />
          ))}
        </div>
      </div>

      {/* Desktop: 7 x 3 grid on a solid surface (no glass on dense data) */}
      <div className="surface-solid hidden overflow-hidden lg:block">
        <table className="w-full table-fixed border-collapse">
          <caption className="sr-only">Meal plan for {weekLabel(monday)}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-24 border-b border-hairline" />
              {days.map((d) => (
                <th
                  key={d}
                  scope="col"
                  className={`border-b border-l border-hairline px-2 py-3 text-center ${d === today ? "bg-tint-orange" : ""}`}
                >
                  <span className={`block text-xs font-semibold uppercase ${d === today ? "text-ink-orange" : "text-ink-muted"}`}>
                    {formatDay(d, { weekday: "short" })}
                  </span>
                  <span className="text-lg font-bold">{formatDay(d, { day: "numeric" })}</span>
                  {d === today && <span className="ml-1.5 rounded-full bg-[image:var(--action)] px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase text-white">Today</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEALS.map((m) => (
              <tr key={m}>
                <th scope="row" className="border-b border-hairline px-3 text-left text-sm font-semibold text-ink-muted">
                  {MEAL_LABEL[m]}
                </th>
                {days.map((d) => (
                  <td key={d} className={`h-[112px] border-b border-l border-hairline p-1.5 align-top ${d === today ? "bg-tint-orange/50" : ""}`}>
                    <SlotCard
                      meal={m}
                      slot={byKey.get(`${d}|${m}`)}
                      onPick={() => setPicker({ date: d, meal: m })}
                      onClear={() => run(() => clearSlot({ date: d, meal: m }))}
                      disabled={pending}
                      label={`${MEAL_LABEL[m]}, ${formatDay(d, { weekday: "long", day: "numeric", month: "long" })}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filled >= 7 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-white/70 px-4 py-3">
          <p className="text-ink-muted">Happy with this week? Others might be too.</p>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setSharing(true)}>
            Publish it to the Market
          </button>
        </div>
      )}

      <DishPicker
        target={picker}
        onClose={() => setPicker(null)}
        dishes={dishes}
        diet={diet}
      />
      <ShareSheet open={sharing} onClose={() => setSharing(false)} monday={monday} selectedDay={selectedDay} diet={diet} />
    </div>
  );
}

function SlotCard({
  meal,
  slot,
  onPick,
  onClear,
  disabled,
  large = false,
  label,
}: {
  meal: Meal;
  slot: PlanSlot | undefined;
  onPick: () => void;
  onClear: () => void;
  disabled: boolean;
  large?: boolean;
  label?: string;
}) {
  const filled = slot?.dish || slot?.isEatout;
  if (!filled) {
    return (
      <button
        type="button"
        onClick={onPick}
        aria-label={label ? `Add ${label}` : `Add ${MEAL_LABEL[meal]}`}
        className={`group flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[rgb(43_29_26/0.18)] text-sm font-medium text-ink-muted transition hover:border-[var(--ink-orange)] hover:bg-tint-orange hover:text-ink-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange ${
          large ? "min-h-[72px] bg-white/70 px-4" : "h-full min-h-[96px]"
        }`}
      >
        <Plus className="h-4 w-4" />
        {large ? `Add ${MEAL_LABEL[meal].toLowerCase()}` : "Add"}
      </button>
    );
  }
  return (
    <div className={`group relative flex h-full rounded-lg ${large ? "min-h-[72px] items-center gap-3 border border-hairline bg-white px-4 py-3" : "min-h-[96px] flex-col bg-white/0 p-2"}`}>
      {large && <span className="w-20 shrink-0 text-xs font-semibold uppercase text-ink-muted">{MEAL_LABEL[meal]}</span>}
      <button
        type="button"
        onClick={onPick}
        className="min-w-0 flex-1 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange"
        aria-label={label ? `Change ${label}` : undefined}
      >
        {slot?.dish ? (
          <>
            <span className="flex items-start gap-1.5">
              <DietDot diet={slot.dish.diet} className="mt-[3px]" />
              <span className={`font-semibold leading-snug ${large ? "text-base" : "line-clamp-3 text-[13px]"}`}>{slot.dish.name}</span>
            </span>
            {slot.dish.cook_minutes && <span className="mt-1 block text-xs text-ink-muted">{slot.dish.cook_minutes} min</span>}
          </>
        ) : (
          <span className="flex items-center gap-1.5 font-semibold text-ink-orange">
            <Utensils className="h-4 w-4" /> Eating out
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={disabled}
        aria-label="Remove"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-fill-subtle hover:text-danger ${
          large ? "" : "absolute right-0.5 top-0.5 opacity-0 focus:opacity-100 group-hover:opacity-100"
        }`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
