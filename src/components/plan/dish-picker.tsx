"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Plus, Search, Utensils } from "lucide-react";

import type { DishOption } from "@/components/plan/types";
import { DietDot } from "@/components/ui/diet-dot";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { quickAddDish, setSlotDish, setSlotEatout } from "@/lib/actions/plan";
import { formatDay } from "@/lib/dates";
import { DIET_ALLOWS, DIET_LABEL, MEAL_LABEL, type Diet, type Meal } from "@/lib/labels";

export function DishPicker({
  target,
  onClose,
  dishes,
  diet,
}: {
  target: { date: string; meal: Meal } | null;
  onClose: () => void;
  dishes: DishOption[];
  diet: Diet;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"suggested" | "mine" | "all">("suggested");

  const list = useMemo(() => {
    if (!target) return [];
    const q = query.trim().toLowerCase();
    const allowed = DIET_ALLOWS[diet];
    return dishes
      .filter((d) => (tab === "mine" ? d.mine : true))
      .filter((d) => (tab === "suggested" ? allowed.includes(d.diet) && (d.meal_types.length === 0 || d.meal_types.includes(target.meal)) : true))
      .filter((d) => !q || d.name.toLowerCase().includes(q))
      .sort((a, b) => Number(b.mine) - Number(a.mine) || a.name.localeCompare(b.name));
  }, [dishes, diet, query, tab, target]);

  function done(promise: Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await promise;
      if (!res.ok) {
        toast(res.error ?? "Couldn't save.", "error");
        return;
      }
      setQuery("");
      onClose();
      router.refresh();
    });
  }

  const title = target ? `${MEAL_LABEL[target.meal]} · ${formatDay(target.date, { weekday: "short", day: "numeric", month: "short" })}` : "";
  const exact = list.some((d) => d.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <Sheet open={!!target} onClose={onClose} title={title}>
      {target && (
        <div className="space-y-4">
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
            <input
              data-autofocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or type a new dish"
              aria-label="Search dishes"
              className="input pl-10"
              maxLength={80}
            />
          </div>
          <div role="tablist" className="flex gap-2">
            {(["suggested", "mine", "all"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} className="chip" onClick={() => setTab(t)}>
                {t === "suggested" ? `For you (${DIET_LABEL[diet]})` : t === "mine" ? "My dishes" : "All"}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {query.trim().length >= 2 && !exact && (
              <button
                type="button"
                disabled={pending}
                onClick={() => done(quickAddDish({ ...target, name: query, diet }))}
                className="flex min-h-[52px] items-center gap-2 rounded-lg border border-dashed border-[var(--ink-orange)] bg-tint-orange px-3 text-left font-semibold text-ink-orange sm:col-span-2"
              >
                <Plus className="h-4 w-4 shrink-0" /> Add &ldquo;{query.trim()}&rdquo; as a new dish
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => done(setSlotEatout(target))}
              className="flex min-h-[52px] items-center gap-2 rounded-lg border border-hairline bg-white px-3 text-left font-semibold hover:border-[var(--ink-orange)]"
            >
              <Utensils className="h-4 w-4 text-ink-orange" /> Eating out
            </button>
            {list.map((d) => (
              <button
                key={d.id}
                type="button"
                disabled={pending}
                onClick={() => done(setSlotDish({ ...target, dishId: d.id }))}
                className="flex min-h-[52px] items-center gap-2 rounded-lg border border-hairline bg-white px-3 text-left hover:border-[var(--ink-orange)] disabled:opacity-60"
              >
                <DietDot diet={d.diet} />
                <span className="min-w-0 flex-1 font-medium leading-snug">{d.name}</span>
                {d.mine && <span className="rounded-full bg-fill-subtle px-2 py-0.5 text-[11px] font-semibold text-ink-muted">Mine</span>}
              </button>
            ))}
          </div>
          {list.length === 0 && query.trim().length < 2 && (
            <p className="py-6 text-center text-ink-muted">No dishes here yet. Type a name above to add one.</p>
          )}
        </div>
      )}
    </Sheet>
  );
}
