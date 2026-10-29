"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Copy,
  Moon,
  Plus,
  ShoppingCart,
  Sun,
  Utensils,
  X,
  Zap,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { TemplatePicker } from "./template-picker";
import type { MealType, PickerTemplate, SlotView } from "./types";

type Props = {
  initialSlots: SlotView[];
  weekStartIso: string;
  /** 1..7, Mon..Sun */
  today: number;
  pickerTemplates: PickerTemplate[];
};

type Meal =
  | { kind: "empty" }
  | { kind: "eatout" }
  | {
      kind: "assigned";
      templateId: string;
      dishName: string;
      kcal: number;
      prepMinutes: number;
    };

/** Local grid state: [dayIdx 0..6][mealIdx 0..2] */
type Grid = Meal[][];

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const MEAL_ICON: Record<MealType, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
};
const MEAL_LETTER: Record<MealType, string> = {
  breakfast: "B",
  lunch: "L",
  dinner: "D",
};
const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Rough kcal + prep minutes per known dishName — used to render meta on cells
 * when we only have {id, dishName, tags} from the DB. Purely presentational. */
function estimateForDish(dishName: string): { kcal: number; prepMinutes: number } {
  const key = dishName.toLowerCase();
  if (key.includes("poha")) return { kcal: 260, prepMinutes: 10 };
  if (key.includes("oats")) return { kcal: 310, prepMinutes: 8 };
  if (key.includes("khichdi")) return { kcal: 380, prepMinutes: 20 };
  if (key.includes("dal") && key.includes("chawal")) return { kcal: 340, prepMinutes: 25 };
  if (key.includes("paneer")) return { kcal: 420, prepMinutes: 20 };
  if (key.includes("veg curry") || key.includes("mixed veg"))
    return { kcal: 310, prepMinutes: 18 };
  return { kcal: 300, prepMinutes: 15 };
}

function slotsToGrid(slots: SlotView[]): Grid {
  const grid: Grid = Array.from({ length: 7 }, () =>
    Array.from({ length: 3 }, () => ({ kind: "empty" }) as Meal),
  );
  for (const s of slots) {
    const dayIdx = s.dayOfWeek - 1; // 1..7 -> 0..6
    const mealIdx = MEAL_TYPES.indexOf(s.mealType);
    if (dayIdx < 0 || dayIdx > 6 || mealIdx < 0) continue;
    if (s.isEatout) {
      grid[dayIdx][mealIdx] = { kind: "eatout" };
    } else if (s.template) {
      const est = estimateForDish(s.template.dishName);
      grid[dayIdx][mealIdx] = {
        kind: "assigned",
        templateId: s.template.id,
        dishName: s.template.dishName,
        kcal: est.kcal,
        prepMinutes: est.prepMinutes,
      };
    }
  }
  return grid;
}

function formatWeekLabel(weekStartIso: string): { label: string; sub: string } {
  const start = new Date(weekStartIso + "T00:00:00Z");
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  const dayName = (d: Date) =>
    d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  return {
    label: `${dayName(start)} ${fmt(start)} – ${dayName(end)} ${fmt(end)}`,
    sub: "This week",
  };
}

function daysOfWeekDates(weekStartIso: string): Array<{ label: string; date: string; iso: string }> {
  const start = new Date(weekStartIso + "T00:00:00Z");
  const out: Array<{ label: string; date: string; iso: string }> = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    out.push({
      label: DAY_SHORT[i].toUpperCase(),
      date: String(d.getUTCDate()),
      iso: d.toISOString().slice(0, 10),
    });
  }
  return out;
}

export function MealPlanBoard({
  initialSlots,
  weekStartIso,
  today,
  pickerTemplates,
}: Props) {
  const params = useSearchParams();
  const dayParam = params?.get("day") ?? null;

  const days = useMemo(() => daysOfWeekDates(weekStartIso), [weekStartIso]);
  const [grid, setGrid] = useState<Grid>(() => slotsToGrid(initialSlots));
  const [selDay, setSelDay] = useState<number>(today - 1);
  const [picker, setPicker] = useState<{ day: number; meal: number } | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cellRefs = useRef<Array<Array<HTMLDivElement | null>>>(
    Array.from({ length: 3 }, () => Array.from({ length: 7 }, () => null)),
  );

  // Sync from ?day=YYYY-MM-DD (from dashboard week strip).
  useEffect(() => {
    if (!dayParam) return;
    const idx = days.findIndex((d) => d.iso === dayParam);
    if (idx >= 0) setSelDay(idx);
  }, [dayParam, days]);

  // Toast auto-dismiss.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = useCallback((msg: string) => setToast(msg), []);

  const openPicker = useCallback((day: number, meal: number) => {
    setPicker({ day, meal });
    setSelDay(day);
  }, []);

  const closePicker = useCallback(() => setPicker(null), []);

  const assignTemplate = useCallback(
    (tpl: PickerTemplate) => {
      if (!picker) return;
      setGrid((g) => {
        const next = g.map((row) => row.slice());
        next[picker.day][picker.meal] = {
          kind: "assigned",
          templateId: tpl.id,
          dishName: tpl.dishName,
          kcal: tpl.avgKcal,
          prepMinutes: tpl.prepMinutes,
        };
        return next;
      });
      notify(`Assigned ${tpl.dishName}`);
      closePicker();
    },
    [picker, notify, closePicker],
  );

  const setEatOut = useCallback(() => {
    if (!picker) return;
    setGrid((g) => {
      const next = g.map((row) => row.slice());
      next[picker.day][picker.meal] = { kind: "eatout" };
      return next;
    });
    notify("Marked as eat-out");
    closePicker();
  }, [picker, notify, closePicker]);

  const clearSlot = useCallback((day: number, meal: number) => {
    setGrid((g) => {
      const next = g.map((row) => row.slice());
      next[day][meal] = { kind: "empty" };
      return next;
    });
  }, []);

  // Nutrition + cart derivations
  const kcalByDay = useMemo(
    () =>
      grid.map((row) =>
        row.reduce((sum, m) => (m.kind === "assigned" ? sum + m.kcal : sum), 0),
      ),
    [grid],
  );
  const assignedCount = useMemo(
    () =>
      grid.reduce(
        (sum, row) =>
          sum + row.filter((m) => m.kind === "assigned").length,
        0,
      ),
    [grid],
  );
  const eatoutCount = useMemo(
    () =>
      grid.reduce(
        (sum, row) => sum + row.filter((m) => m.kind === "eatout").length,
        0,
      ),
    [grid],
  );
  const daysPlannedCount = useMemo(
    () =>
      grid.filter((row) => row.some((m) => m.kind !== "empty")).length,
    [grid],
  );
  const weeklyAvgKcal = useMemo(() => {
    const days = kcalByDay.filter((k) => k > 0);
    if (!days.length) return 0;
    return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
  }, [kcalByDay]);

  // Today's cart summary (uses today's assigned meals)
  const todayAssignedIds = useMemo(() => {
    const row = grid[today - 1] ?? [];
    return row
      .filter((m): m is Extract<Meal, { kind: "assigned" }> => m.kind === "assigned")
      .map((m) => m.templateId);
  }, [grid, today]);
  const todayItems = todayAssignedIds.length * 4; // rough item count for display
  const todayCost = todayAssignedIds.length * 120;

  // Actions
  const onCopyLastWeek = () => {
    notify("Last week's plan copied (mock)");
    console.log("[meal-plan] copy-last-week");
  };
  const onAutoFill = () => {
    setGrid((g) => {
      const next = g.map((row) => row.slice());
      for (let d = 0; d < 7; d++) {
        for (let m = 0; m < 3; m++) {
          if (next[d][m].kind === "empty") {
            const pick =
              pickerTemplates[Math.floor(Math.random() * pickerTemplates.length)];
            next[d][m] = {
              kind: "assigned",
              templateId: pick.id,
              dishName: pick.dishName,
              kcal: pick.avgKcal,
              prepMinutes: pick.prepMinutes,
            };
          }
        }
      }
      return next;
    });
    notify("Week auto-filled with recommended meals");
  };
  const onPrevWeek = () => notify("Previous week (mock)");
  const onNextWeek = () => notify("Next week (mock)");

  const addToInstamart = async () => {
    if (!todayAssignedIds.length || busy) return;
    setBusy(true);
    try {
      const buildRes = await fetch("/api/cart/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateIds: todayAssignedIds,
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!buildRes.ok) throw new Error("cart/build failed");
      const cart = await buildRes.json().catch(() => ({}));

      const addRes = await fetch("/api/cart/add-to-instamart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart }),
      });
      if (!addRes.ok) throw new Error("cart/add-to-instamart failed");

      notify("Added to Instamart cart");
    } catch (err) {
      console.error("[meal-plan] add-to-instamart", err);
      notify("Could not add to cart — see console");
    } finally {
      setBusy(false);
    }
  };

  // Keyboard arrow navigation between cells.
  const onCellKeyDown = (
    e: ReactKeyboardEvent<HTMLDivElement>,
    day: number,
    meal: number,
  ) => {
    let nd = day;
    let nm = meal;
    switch (e.key) {
      case "ArrowLeft":
        nd = Math.max(0, day - 1);
        break;
      case "ArrowRight":
        nd = Math.min(6, day + 1);
        break;
      case "ArrowUp":
        nm = Math.max(0, meal - 1);
        break;
      case "ArrowDown":
        nm = Math.min(2, meal + 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        openPicker(day, meal);
        return;
      default:
        return;
    }
    e.preventDefault();
    const target = cellRefs.current[nm]?.[nd];
    target?.focus();
  };

  const weekLabel = formatWeekLabel(weekStartIso);

  return (
    <div className="mx-auto max-w-[1160px] px-5 pb-8 pt-[18px]">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous week"
            onClick={onPrevWeek}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[var(--sw-border)] bg-[var(--sw-page)] text-[var(--sw-charcoal)] transition hover:bg-[var(--sw-border)] focus-visible:outline-2 focus-visible:outline-[var(--sw-orange)]"
          >
            <ChevronLeft className="h-[15px] w-[15px]" />
          </button>
          <div>
            <span className="text-[15px] font-bold tracking-tight text-[var(--sw-charcoal)]">
              {weekLabel.label}
            </span>
            <span className="ml-1.5 text-[11px] font-normal text-[var(--sw-muted)]">
              {weekLabel.sub}
            </span>
          </div>
          <button
            type="button"
            aria-label="Next week"
            onClick={onNextWeek}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[var(--sw-border)] bg-[var(--sw-page)] text-[var(--sw-charcoal)] transition hover:bg-[var(--sw-border)] focus-visible:outline-2 focus-visible:outline-[var(--sw-orange)]"
          >
            <ChevronRight className="h-[15px] w-[15px]" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCopyLastWeek}
            className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-[var(--sw-border)] bg-white/70 backdrop-blur-md px-3.5 py-[7px] text-xs font-semibold text-[var(--sw-charcoal)] transition hover:border-[#C0C0C4] hover:bg-[var(--sw-page)]"
          >
            <Copy className="h-[15px] w-[15px]" />
            Copy last week
          </button>
          <button
            type="button"
            onClick={onAutoFill}
            className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-[var(--sw-orange)] bg-appetite px-3.5 py-[7px] text-xs font-semibold text-white transition hover:opacity-90"
          >
            <Zap className="h-[15px] w-[15px]" />
            Auto-fill week
          </button>
        </div>
      </div>

      {/* Grid + right panel */}
      <div className="flex gap-3.5">
        <div className="min-w-0 flex-1">
          <div
            role="grid"
            aria-label="Weekly meal plan"
            aria-rowcount={4}
            aria-colcount={8}
            className="overflow-hidden rounded-lg glass"
          >
            {/* Header row */}
            <div
              role="row"
              className="grid border-b border-[var(--sw-border)]"
              style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}
            >
              <div
                role="columnheader"
                aria-label="Meal type"
                className="border-r border-[var(--sw-border)] bg-[var(--sw-page)]"
              />
              {days.map((d, i) => {
                const isToday = i === today - 1;
                const isSel = i === selDay;
                return (
                  <button
                    key={d.iso}
                    role="columnheader"
                    type="button"
                    onClick={() => setSelDay(i)}
                    aria-label={`${d.label} ${d.date}${isToday ? " (today)" : ""}`}
                    className={`relative border-l border-[var(--sw-border)] px-1.5 py-2.5 text-center transition hover:bg-[var(--sw-page)] focus-visible:outline-2 focus-visible:outline-[var(--sw-orange)] ${
                      isSel ? "bg-[var(--sw-orange-tint)]" : ""
                    }`}
                  >
                    {isToday && (
                      <span className="absolute inset-x-0 top-0 h-[3px] bg-appetite" />
                    )}
                    <div
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        isToday
                          ? "text-[var(--sw-orange)]"
                          : "text-[var(--sw-muted)]"
                      }`}
                    >
                      {d.label}
                    </div>
                    <div
                      className={`text-[15px] font-bold ${
                        isToday
                          ? "text-[var(--sw-orange)]"
                          : "text-[var(--sw-charcoal)]"
                      }`}
                    >
                      {d.date}
                    </div>
                    {isToday && (
                      <span className="mt-0.5 inline-block rounded-full bg-appetite px-1.5 py-px text-[8px] font-bold tracking-wider text-white">
                        TODAY
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Meal rows */}
            {MEAL_TYPES.map((mealType, mealIdx) => {
              const Icon = MEAL_ICON[mealType];
              return (
                <div
                  key={mealType}
                  role="row"
                  className="grid border-t border-[var(--sw-border)]"
                  style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}
                >
                  <div
                    role="rowheader"
                    aria-label={MEAL_LABEL[mealType]}
                    className="flex flex-col items-center justify-center gap-[3px] border-r border-[var(--sw-border)] bg-[var(--sw-page)] px-1.5"
                  >
                    <Icon className="h-[15px] w-[15px] text-[var(--sw-muted)]" />
                    <span className="text-[8.5px] font-bold uppercase tracking-wider text-[var(--sw-muted)]">
                      {MEAL_LETTER[mealType]}
                    </span>
                  </div>
                  {days.map((d, dayIdx) => {
                    const meal = grid[dayIdx][mealIdx];
                    const isToday = dayIdx === today - 1;
                    const isSelCol = dayIdx === selDay;
                    const isPickerCell =
                      picker?.day === dayIdx && picker?.meal === mealIdx;
                    const label =
                      meal.kind === "assigned"
                        ? `${d.label} ${MEAL_LABEL[mealType]}: ${meal.dishName}`
                        : meal.kind === "eatout"
                          ? `${d.label} ${MEAL_LABEL[mealType]}: Eat out`
                          : `${d.label} ${MEAL_LABEL[mealType]}: empty. Press Enter to add.`;
                    return (
                      <div
                        key={d.iso}
                        role="gridcell"
                        tabIndex={0}
                        ref={(el) => {
                          cellRefs.current[mealIdx][dayIdx] = el;
                        }}
                        aria-label={label}
                        onClick={() => openPicker(dayIdx, mealIdx)}
                        onKeyDown={(e) => onCellKeyDown(e, dayIdx, mealIdx)}
                        className={`group relative min-h-[78px] cursor-pointer border-l border-[var(--sw-border)] p-1.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--sw-orange)] ${
                          isPickerCell
                            ? "bg-[var(--sw-orange-tint)] shadow-[inset_0_0_0_2px_var(--sw-orange)]"
                            : meal.kind === "eatout"
                              ? "bg-[#FFF8F2] hover:bg-[#FFF4EC]"
                              : meal.kind === "assigned"
                                ? "bg-white/70 backdrop-blur-md hover:bg-[#FAFAFA]"
                                : "hover:bg-[var(--sw-page)]"
                        } ${
                          !isPickerCell && isSelCol
                            ? "bg-[var(--sw-orange-tint)]"
                            : ""
                        } ${
                          !isPickerCell && !isSelCol && isToday
                            ? "bg-[rgba(252,128,25,0.02)]"
                            : ""
                        }`}
                      >
                        {meal.kind === "empty" && (
                          <div className="flex h-full flex-col items-center justify-center gap-1.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-dashed border-[var(--sw-border)] text-[var(--sw-border)] transition group-hover:border-[#C0C0C4] group-hover:text-[#C0C0C4]">
                              <Plus className="h-3 w-3" />
                            </div>
                            <span className="text-[10px] font-medium text-[var(--sw-border)] transition group-hover:text-[#C0C0C4]">
                              Add meal
                            </span>
                          </div>
                        )}
                        {meal.kind === "eatout" && (
                          <div className="flex h-full flex-col items-center justify-center gap-1.5">
                            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[var(--sw-orange-tint)] text-[var(--sw-orange)]">
                              <Utensils className="h-3 w-3" />
                            </div>
                            <span className="text-[10px] font-semibold text-[var(--sw-orange)]">
                              Eat out
                            </span>
                          </div>
                        )}
                        {meal.kind === "assigned" && (
                          <>
                            <div className="mb-1 text-[8.5px] font-bold uppercase tracking-wider text-[var(--sw-muted)]">
                              {MEAL_LABEL[mealType]}
                            </div>
                            <div className="mb-1 text-[11.5px] font-bold leading-[1.3] tracking-tight text-[var(--sw-charcoal)]">
                              {meal.dishName}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--sw-muted)]">
                              <Clock className="h-3 w-3" />
                              <span className="font-semibold text-[var(--sw-charcoal)]">
                                {meal.kcal}
                              </span>
                              <span>kcal</span>
                              <span>·</span>
                              <span>{meal.prepMinutes} min</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearSlot(dayIdx, mealIdx);
                                notify("Slot cleared");
                              }}
                              aria-label={`Remove ${meal.dishName}`}
                              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-[var(--sw-muted)] opacity-0 transition hover:bg-[var(--sw-page)] hover:text-[var(--sw-charcoal)] group-hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPicker(dayIdx, mealIdx);
                              }}
                              className="absolute bottom-1 right-1.5 border-none bg-transparent p-0 text-[9.5px] font-semibold text-[var(--sw-orange)] opacity-0 transition group-hover:opacity-100"
                            >
                              Change
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel — nutrition + cart summary */}
        <aside className="w-[268px] flex-shrink-0">
          <div className="mb-2.5 rounded-lg glass p-4">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--sw-muted)]">
              Weekly Nutrition
            </div>
            <div className="mb-[3px] text-sm font-bold tracking-tight text-[var(--sw-charcoal)]">
              {weeklyAvgKcal ? weeklyAvgKcal.toLocaleString("en-IN") : "—"} kcal avg / day
            </div>
            <div className="mb-3.5 text-[11px] text-[var(--sw-muted)]">
              Target: 1,450 kcal · {weeklyAvgKcal && weeklyAvgKcal <= 1500 ? "On track" : "Planning"}
            </div>
            <NutritionBars kcalByDay={kcalByDay} todayIdx={today - 1} />
            <div className="mb-3 flex justify-between text-[8.5px] font-semibold text-[var(--sw-muted)]">
              {DAY_SHORT.map((d) => (
                <span key={d}>{d[0]}</span>
              ))}
            </div>
            <NutStat label="Days planned" value={`${daysPlannedCount} / 7`} />
            <NutStat label="Eat-out slots" value={String(eatoutCount)} />
            <NutStat
              label="Weekly avg kcal"
              value={weeklyAvgKcal ? weeklyAvgKcal.toLocaleString("en-IN") : "—"}
              tone="green"
            />
            <div className="mt-3 flex gap-2">
              <MacroTile v="82g" l="Protein" />
              <MacroTile v="145g" l="Carbs" />
              <MacroTile v="38g" l="Fat" />
            </div>
          </div>

          <div className="rounded-lg glass px-4 py-3.5">
            <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--sw-muted)]">
              Today&apos;s Cart
            </div>
            <CartRow label="Ingredients needed" value={`${todayItems} items`} />
            <CartRow label="Estimated cost" value={`₹${todayCost}`} />
            <CartRow
              label="Assigned today"
              value={`${todayAssignedIds.length} meals`}
              tone="green"
            />
            <button
              type="button"
              onClick={addToInstamart}
              disabled={busy || todayAssignedIds.length === 0}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-appetite px-3 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingCart className="h-[15px] w-[15px]" />
              {busy ? "Adding..." : "Add to Instamart cart"}
            </button>
          </div>
        </aside>
      </div>

      {picker && (
        <TemplatePicker
          templates={pickerTemplates}
          initialMealType={MEAL_TYPES[picker.meal]}
          dayLabel={days[picker.day]?.label ?? ""}
          mealLabel={MEAL_LABEL[MEAL_TYPES[picker.meal]]}
          onClose={closePicker}
          onSelect={assignTemplate}
          onEatOut={setEatOut}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 left-1/2 z-[300] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--sw-charcoal)] px-5 py-2.5 text-xs font-semibold text-white shadow-lg"
        >
          <Check className="h-[15px] w-[15px]" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

/** Small helpers below — kept in file to avoid noise. */

function NutritionBars({
  kcalByDay,
  todayIdx,
}: {
  kcalByDay: number[];
  todayIdx: number;
}) {
  const maxKcal = Math.max(1500, ...kcalByDay);
  return (
    <div className="mb-2 flex h-[60px] items-end gap-1">
      {kcalByDay.map((k, i) => {
        const h = k ? Math.round((k / maxKcal) * 52) : 4;
        const isToday = i === todayIdx;
        const bg = isToday
          ? "bg-appetite"
          : k > 0
            ? "bg-[var(--sw-charcoal)] opacity-30"
            : "bg-[var(--sw-border)]";
        return (
          <div key={i} className="flex flex-1 flex-col items-center">
            <div
              className={`w-full rounded-t ${bg}`}
              style={{ height: `${h}px` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function NutStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green";
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--sw-border)] py-1.5 text-[11.5px] last:border-b-0">
      <span className="text-[var(--sw-muted)]">{label}</span>
      <span
        className={`font-bold ${tone === "green" ? "text-[var(--sw-green)]" : "text-[var(--sw-charcoal)]"}`}
      >
        {value}
      </span>
    </div>
  );
}

function MacroTile({ v, l }: { v: string; l: string }) {
  return (
    <div className="flex-1 rounded-md bg-[var(--sw-page)] p-2 text-center">
      <div className="text-sm font-bold tracking-tight text-[var(--sw-charcoal)]">
        {v}
      </div>
      <div className="mt-0.5 text-[9px] text-[var(--sw-muted)]">{l}</div>
    </div>
  );
}

function CartRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green";
}) {
  return (
    <div className="flex justify-between border-b border-[var(--sw-border)] py-1 text-xs last:border-b-0">
      <span className="text-[var(--sw-muted)]">{label}</span>
      <span
        className={`font-bold ${tone === "green" ? "text-[var(--sw-green)]" : "text-[var(--sw-charcoal)]"}`}
      >
        {value}
      </span>
    </div>
  );
}

