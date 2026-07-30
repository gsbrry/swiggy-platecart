"use client";

import { Clock, Flame, Utensils } from "lucide-react";

import type { TemplateDraft } from "./types";

type Props = {
  draft: TemplateDraft;
};

const DIET_LABEL: Record<string, string> = {
  veg: "Vegetarian",
  nonveg: "Non-Veg",
  vegan: "Vegan",
  keto: "Keto",
  jain: "Jain",
  glutenfree: "Gluten-Free",
};

const GOAL_LABEL: Record<string, string> = {
  quick: "Quick",
  protein: "High Protein",
  light: "Light",
  "weight-loss": "Weight Loss",
  "muscle-gain": "Muscle Gain",
  maintain: "Maintain",
};

function estimateKcal(draft: TemplateDraft): number | null {
  const filled = draft.ingredients.filter((i) => i.name.trim());
  if (filled.length === 0) return null;
  // Rough placeholder — 90 kcal per ingredient row, capped
  return Math.min(900, filled.length * 90);
}

export function PreviewPanel({ draft }: Props) {
  const kcal = estimateKcal(draft);
  const dietLabel = draft.diet ? DIET_LABEL[draft.diet] : null;
  const dietIsVeg =
    draft.diet === "veg" || draft.diet === "vegan" || draft.diet === "jain";

  return (
    <aside
      className="sticky top-[74px] flex flex-col gap-3"
      aria-live="polite"
    >
      <div className="overflow-hidden rounded-lg border border-[var(--sw-border)] bg-white">
        <div className="border-b border-[var(--sw-border)] px-3.5 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--sw-muted)]">
            Live preview
          </div>
          <div className="mt-0.5 text-[10.5px] text-[var(--sw-muted)]">
            How it appears in the browser
          </div>
        </div>
        <div className="relative flex h-[88px] items-center justify-center border-b border-[var(--sw-border)] bg-[var(--sw-page)]">
          <Utensils className="h-9 w-9 text-[var(--sw-border)]" />
          <span
            className={`absolute left-2 top-2 h-[7px] w-[7px] rounded-full ${
              dietIsVeg ? "bg-[var(--sw-green)]" : "bg-[#DC2626]"
            }`}
          />
        </div>
        <div className="px-3 py-2.5">
          <div
            className={`min-h-[18px] text-[13px] font-bold tracking-tight ${
              draft.dishName ? "text-[var(--sw-charcoal)]" : "text-[var(--sw-muted)]"
            }`}
          >
            {draft.dishName || "Your dish name"}
          </div>
          <div className="mt-1.5 flex min-h-[22px] flex-wrap gap-1">
            {dietLabel ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9.5px] ${
                  dietIsVeg
                    ? "bg-[rgba(96,178,70,0.1)] text-[var(--sw-green)]"
                    : "bg-[var(--sw-page)] text-[var(--sw-muted)]"
                }`}
              >
                {dietLabel}
              </span>
            ) : null}
            {draft.goalTags.map((g) => (
              <span
                key={g}
                className="rounded-full bg-[var(--sw-orange-tint)] px-1.5 py-0.5 text-[9.5px] text-[var(--sw-orange)]"
              >
                {GOAL_LABEL[g] ?? g}
              </span>
            ))}
            {draft.mealType && draft.mealType !== "any" ? (
              <span className="rounded-full bg-[var(--sw-page)] px-1.5 py-0.5 text-[9.5px] text-[var(--sw-muted)]">
                {draft.mealType}
              </span>
            ) : null}
          </div>
          <div className="mb-2 mt-1 flex items-center gap-1.5 text-[10.5px] text-[var(--sw-muted)]">
            <Flame className="h-3 w-3" />
            <span className="font-bold text-[var(--sw-charcoal)]">
              {kcal ? `${kcal} kcal` : "—"}
            </span>
            <span className="text-[var(--sw-border)]">·</span>
            <Clock className="h-3 w-3" />
            <span>
              {draft.prepMinutes > 0 ? `${draft.prepMinutes} min` : "—"}
            </span>
            <span className="text-[var(--sw-border)]">·</span>
            <span className="capitalize">{draft.difficulty}</span>
          </div>
          <button
            type="button"
            disabled
            className="w-full cursor-default rounded-md bg-[var(--sw-border)] py-1.5 text-[11px] font-bold text-[var(--sw-muted)]"
          >
            + Add to plan
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--sw-border)] bg-white p-3.5">
        <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--sw-muted)]">
          Auto-calculated
        </div>
        <CalcRow label="Calories / serving" value={kcal ? `${kcal} kcal` : "—"} />
        <CalcRow
          label="Ingredients"
          value={
            draft.ingredients.filter((i) => i.name.trim()).length > 0
              ? `${draft.ingredients.filter((i) => i.name.trim()).length}`
              : "—"
          }
        />
        <CalcRow
          label="Steps"
          value={
            draft.steps.filter((s) => s.text.trim()).length > 0
              ? `${draft.steps.filter((s) => s.text.trim()).length}`
              : "—"
          }
        />
        <CalcRow
          label="Est. cost / serving"
          value={
            draft.costPerServing ? `₹${draft.costPerServing}` : "—"
          }
        />
      </div>
    </aside>
  );
}

function CalcRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-[var(--sw-border)] py-1.5 text-xs last:border-b-0">
      <span className="text-[var(--sw-muted)]">{label}</span>
      <span className="font-bold text-[var(--sw-charcoal)]">{value}</span>
    </div>
  );
}
