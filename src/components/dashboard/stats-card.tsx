"use client";

import { useState } from "react";

type WastePattern = { ingredient: string; count: number };

type Props = {
  daysOnPlan: number;
  spentGroceries: number;
  savedVsLastMonth: number;
  wastePatterns: WastePattern[];
};

/** Activity & Insights card + optional waste nudge. */
export function StatsCard({
  daysOnPlan,
  spentGroceries,
  savedVsLastMonth,
  wastePatterns,
}: Props) {
  // TODO(dashboard): persist dismissal to /api/waste/nudge/dismiss when built.
  const [dismissed, setDismissed] = useState(false);

  const topPattern = wastePatterns[0];
  const showNudge = !dismissed && topPattern;

  const savedLabel =
    savedVsLastMonth === 0
      ? "—"
      : `${savedVsLastMonth > 0 ? "+" : ""}₹${Math.abs(savedVsLastMonth).toLocaleString("en-IN")}`;

  return (
    <div className="rounded-lg glass px-5 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold tracking-tight text-[var(--sw-charcoal)]">
          Activity & Insights
        </h2>
        <a
          href="/budget"
          className="text-xs font-semibold text-[var(--sw-orange)] hover:opacity-80"
        >
          Budget tracker →
        </a>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        <Stat
          value={String(daysOnPlan)}
          label="Days on plan this month"
        />
        <Stat
          value={`₹${spentGroceries.toLocaleString("en-IN")}`}
          label="Groceries this month"
          tone="orange"
        />
        <Stat value={savedLabel} label="Saved vs last month" tone="green" />
      </div>

      {showNudge && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-lg border border-[#FCDBBD] bg-[#FFF8F2] px-3 py-2.5"
        >
          <span className="mt-0.5 flex-shrink-0 text-sm" aria-hidden>
            💡
          </span>
          <div className="text-xs leading-relaxed text-[var(--sw-charcoal)]">
            You&apos;ve wasted{" "}
            <strong className="text-[var(--sw-orange)]">
              {topPattern.ingredient} {topPattern.count} times
            </strong>{" "}
            this month. Your next Instamart order will have a smaller quantity — approve or adjust
            before confirming.
            <div className="mt-1 flex items-center gap-3">
              <a
                href="/cart"
                className="text-[11px] font-bold text-[var(--sw-orange)] hover:opacity-80"
              >
                Review restock list →
              </a>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="text-[11px] font-medium text-[var(--sw-muted)] hover:text-[var(--sw-charcoal)]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: "orange" | "green";
}) {
  const color =
    tone === "orange"
      ? "text-[var(--sw-orange)]"
      : tone === "green"
        ? "text-[var(--sw-green)]"
        : "text-[var(--sw-charcoal)]";
  return (
    <div className="rounded-lg bg-[var(--sw-page)] p-3">
      <div className={`mb-1 text-[22px] font-bold leading-none tracking-tight ${color}`}>
        {value}
      </div>
      <div className="text-[11px] leading-snug text-[var(--sw-muted)]">{label}</div>
    </div>
  );
}
