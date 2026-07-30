"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  initialMonth: string;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function parseLabel(label: string): { m: number; y: number } {
  const [mon, yr] = label.split(" ");
  const m = MONTHS.indexOf(mon as (typeof MONTHS)[number]);
  return { m: m < 0 ? 6 : m, y: Number(yr) || new Date().getFullYear() };
}

function formatLabel(m: number, y: number): string {
  return `${MONTHS[((m % 12) + 12) % 12]} ${y}`;
}

/** Prev/next month picker. Logs to console on change (no backend wiring yet). */
export function MonthSelector({ initialMonth }: Props) {
  const [label, setLabel] = useState<string>(initialMonth);

  const shift = (delta: number) => {
    const { m, y } = parseLabel(label);
    const total = y * 12 + m + delta;
    const nextY = Math.floor(total / 12);
    const nextM = ((total % 12) + 12) % 12;
    const next = formatLabel(nextM, nextY);
    setLabel(next);
    // eslint-disable-next-line no-console
    console.log("[budget] month changed:", next);
  };

  return (
    <div className="flex items-center gap-1 rounded-full border border-[var(--sw-border)] bg-white px-1.5 py-1">
      <button
        type="button"
        onClick={() => shift(-1)}
        aria-label="Previous month"
        className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--sw-charcoal)] hover:bg-[var(--sw-page)]"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="min-w-[86px] text-center text-xs font-semibold tracking-tight text-[var(--sw-charcoal)]">
        {label}
      </div>
      <button
        type="button"
        onClick={() => shift(1)}
        aria-label="Next month"
        className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--sw-charcoal)] hover:bg-[var(--sw-page)]"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
