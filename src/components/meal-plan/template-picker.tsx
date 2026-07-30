"use client";

import { Clock, GitFork, Search, Utensils, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { MealType, PickerTemplate } from "./types";

type Props = {
  templates: PickerTemplate[];
  initialMealType: MealType;
  dayLabel: string;
  mealLabel: string;
  onClose: () => void;
  onSelect: (tpl: PickerTemplate) => void;
  onEatOut: () => void;
};

type Filter = "all" | "veg" | "highprot" | "light" | "quick";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All" },
  { key: "veg", label: "Veg" },
  { key: "highprot", label: "High Protein" },
  { key: "light", label: "Light" },
  { key: "quick", label: "Quick <10 min" },
];

export function TemplatePicker({
  templates,
  dayLabel,
  mealLabel,
  onClose,
  onSelect,
  onEatOut,
}: Props) {
  const titleId = useId();
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Focus trap + ESC + return focus on unmount.
  useEffect(() => {
    previouslyFocused.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;

    // Focus the search input on open.
    const t = window.setTimeout(() => searchRef.current?.focus(), 30);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      const matchesQuery = !q || t.dishName.toLowerCase().includes(q);
      const matchesFilter = filter === "all" || t.filters.includes(filter);
      return matchesQuery && matchesFilter;
    });
  }, [templates, query, filter]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 px-4 py-6"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[600px] w-full max-w-[420px] flex-col overflow-hidden rounded-lg border border-[var(--sw-border)] bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-[var(--sw-border)] px-4 py-3">
          <div>
            <h2
              id={titleId}
              className="text-[11px] font-bold text-[var(--sw-charcoal)]"
            >
              Pick a meal for {dayLabel} {mealLabel}
            </h2>
            <p className="text-[10.5px] text-[var(--sw-muted)]">
              Select a template for this slot
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close picker"
            className="ml-2 flex h-6 w-6 items-center justify-center rounded-full text-[var(--sw-muted)] hover:bg-[var(--sw-page)] hover:text-[var(--sw-charcoal)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative border-b border-[var(--sw-border)] px-3 py-2">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[var(--sw-muted)]" />
          <label htmlFor={searchId} className="sr-only">
            Search templates
          </label>
          <input
            id={searchId}
            ref={searchRef}
            type="text"
            placeholder="Search templates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-[var(--sw-border)] bg-[var(--sw-page)] py-1.5 pl-8 pr-2 text-xs text-[var(--sw-charcoal)] outline-none focus:border-[var(--sw-orange)]"
          />
        </div>

        <div
          role="tablist"
          aria-label="Filter templates"
          className="flex gap-1.5 overflow-x-auto border-b border-[var(--sw-border)] px-3 py-2"
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`whitespace-nowrap rounded-full border-[1.5px] px-2.5 py-1 text-[10.5px] font-semibold transition ${
                  active
                    ? "border-[var(--sw-orange)] bg-[var(--sw-orange-tint)] text-[var(--sw-orange)]"
                    : "border-[var(--sw-border)] bg-white text-[var(--sw-muted)] hover:border-[#C0C0C4] hover:text-[var(--sw-charcoal)]"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <ul className="flex-1 overflow-y-auto py-1.5">
          {filtered.length === 0 && (
            <li className="p-5 text-center text-xs text-[var(--sw-muted)]">
              No templates match
            </li>
          )}
          {filtered.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onSelect(t)}
                className="w-full border-b border-[var(--sw-border)] px-3 py-2.5 text-left transition last:border-b-0 hover:bg-[var(--sw-page)] focus-visible:bg-[var(--sw-page)] focus-visible:outline-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="mb-[3px] truncate text-xs font-bold tracking-tight text-[var(--sw-charcoal)]">
                      {t.dishName}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {t.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[var(--sw-page)] px-1.5 py-px text-[9.5px] text-[var(--sw-muted)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-[11px] font-bold text-[var(--sw-charcoal)]">
                      {t.avgKcal} kcal
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-[var(--sw-muted)]">
                      <GitFork className="h-3 w-3" />
                      {t.forks}
                    </div>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-[var(--sw-muted)]">
                  <Clock className="h-3 w-3" />
                  {t.prepMinutes} min prep
                </div>
              </button>
            </li>
          ))}
        </ul>

        <div className="border-t border-[var(--sw-border)] px-3 py-2.5">
          <button
            type="button"
            onClick={onEatOut}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-[var(--sw-border)] bg-white py-2 text-xs font-semibold text-[var(--sw-muted)] transition hover:border-[var(--sw-orange)] hover:bg-[var(--sw-orange-tint)] hover:text-[var(--sw-orange)]"
          >
            <Utensils className="h-[15px] w-[15px]" />
            Make this an eat-out slot
          </button>
        </div>
      </div>
    </div>
  );
}
