"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  Flame,
  GitFork,
  Leaf,
  ShoppingCart,
  TrendingDown,
  Utensils,
  X,
} from "lucide-react";

import type { BrowserTemplate, TemplateMealType } from "@/components/templates/types";
import type { TemplateDetail, TemplateIngredient } from "@/components/templates/detail/mock-details";

type SimilarTemplate = Pick<
  BrowserTemplate,
  "id" | "dishName" | "tags" | "kcal" | "prepMinutes" | "forkCount"
>;

type Props = {
  template: BrowserTemplate;
  detail: TemplateDetail;
  similar: SimilarTemplate[];
};

const SERVING_OPTIONS = [1, 2, 4] as const;
type ServingOption = (typeof SERVING_OPTIONS)[number];

const DAY_LABELS = ["Today", "Tomorrow"] as const;
const MEAL_TYPES: TemplateMealType[] = ["breakfast", "lunch", "dinner"];

function difficultyLabel(d: BrowserTemplate["difficulty"]): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

function formatQty(qty: number): string {
  // Show up to 2 decimals but strip trailing zeros; render whole numbers whole.
  if (Number.isInteger(qty)) return qty.toString();
  return Number(qty.toFixed(2)).toString();
}

function scaleIngredient(ing: TemplateIngredient, factor: number): string {
  return `${formatQty(ing.qty * factor)} ${ing.unit}`;
}

export function TemplateDetailView({ template, detail, similar }: Props) {
  const [servings, setServings] = useState<ServingOption>(
    (SERVING_OPTIONS as readonly number[]).includes(detail.baseServings)
      ? (detail.baseServings as ServingOption)
      : 2,
  );
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [forkOpen, setForkOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  const factor = servings / detail.baseServings;

  const scaledMacros = useMemo(
    () => ({
      kcal: Math.round(template.kcal * factor),
      protein: Math.round(detail.protein * factor),
      carbs: Math.round(detail.carbs * factor),
      fat: Math.round(detail.fat * factor),
    }),
    [template.kcal, detail.protein, detail.carbs, detail.fat, factor],
  );

  const flashToast = useCallback((msg: string) => {
    setToast(msg);
    console.log("[toast]", msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  const toggleCheck = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-[1160px] px-5 pb-10 pt-4">
      {/* BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-[var(--sw-muted)]">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              href="/templates"
              className="font-medium text-[var(--sw-orange)] hover:underline"
            >
              Templates
            </Link>
          </li>
          <li aria-hidden className="text-[var(--sw-border)]">
            <ChevronRight className="h-3 w-3" />
          </li>
          <li aria-current="page" className="text-[var(--sw-charcoal)]">
            {template.dishName}
          </li>
        </ol>
      </nav>

      {/* HERO */}
      <section className="mb-3.5 overflow-hidden rounded-lg border border-[var(--sw-border)] bg-white">
        <div className="flex gap-0">
          <div className="relative flex w-[200px] flex-shrink-0 items-center justify-center border-r border-[var(--sw-border)] bg-[var(--sw-page)]">
            <Utensils
              className="h-[52px] w-[52px] text-[var(--sw-border)]"
              strokeWidth={1.5}
            />
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[var(--sw-green)]">
              <Leaf className="h-3 w-3" strokeWidth={1.75} />
              Vegetarian
            </div>
          </div>
          <div className="flex-1 p-5">
            <div className="mb-2.5 flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[var(--sw-border)] bg-[var(--sw-page)] text-[8px] font-bold text-[var(--sw-muted)]">
                  {detail.creatorInitials}
                </div>
                <span className="text-[11.5px] font-medium text-[var(--sw-muted)]">
                  by <strong className="font-bold">{detail.creatorHandle}</strong>
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--sw-muted)]">
                <GitFork className="h-3 w-3" />
                {template.forkCount.toLocaleString("en-IN")} forks
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold leading-tight tracking-tight text-[var(--sw-charcoal)]">
              {template.dishName}
            </h1>
            <div className="flex flex-wrap gap-1.5">
              {template.tags.map((tag, i) => {
                const isVeg = /veg/i.test(tag);
                const isGoal = i === 1 && detail.goalMatch;
                return (
                  <span
                    key={tag}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      isVeg
                        ? "bg-[rgba(96,178,70,0.1)] text-[var(--sw-green)]"
                        : isGoal
                          ? "bg-[var(--sw-orange-tint)] text-[var(--sw-orange)]"
                          : "bg-[var(--sw-page)] text-[var(--sw-muted)]"
                    }`}
                  >
                    {tag}
                  </span>
                );
              })}
              {detail.goalMatch ? (
                <span className="rounded-full bg-[var(--sw-orange-tint)] px-2.5 py-1 text-[11px] font-semibold text-[var(--sw-orange)]">
                  {detail.goalMatch}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="-mx-px flex border-y border-[var(--sw-border)]">
          <StatBlock value={template.kcal.toString()} label="kcal per serving" orange icon="flame" />
          <StatBlock value={`${detail.protein}g`} label="protein" />
          <StatBlock value={template.prepMinutes.toString()} label="min prep" icon="clock" />
          <StatBlock value={difficultyLabel(template.difficulty)} label="difficulty" />
          <StatBlock value={`₹${detail.cost}`} label="est. cost / serving" last />
        </div>

        {/* SOCIAL PROOF */}
        <div className="flex flex-wrap items-center gap-5 border-t border-[var(--sw-border)] px-5 py-2.5">
          <div className="flex items-center gap-1.5 text-xs text-[var(--sw-muted)]">
            <ShoppingCart className="h-3.5 w-3.5" />
            <b className="font-bold text-[var(--sw-charcoal)]">
              {detail.buyCountMonthly.toLocaleString("en-IN")}
            </b>
            &nbsp;people added to Instamart this month
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--sw-muted)]">
            <GitFork className="h-3.5 w-3.5" />
            Forked&nbsp;
            <b className="font-bold text-[var(--sw-charcoal)]">
              {template.forkCount.toLocaleString("en-IN")}
            </b>
            &nbsp;times
          </div>
          {detail.goalMatch ? (
            <div className="flex items-center gap-1.5 text-xs text-[var(--sw-muted)]">
              <TrendingDown className="h-3.5 w-3.5" />
              Matches your&nbsp;
              <b className="font-bold text-[var(--sw-charcoal)]">{detail.goalMatch}</b>
              &nbsp;goal
            </div>
          ) : null}
        </div>
      </section>

      {/* TWO COLUMN */}
      <div className="grid gap-3.5 lg:grid-cols-[1fr_380px]">
        {/* INGREDIENTS */}
        <section className="overflow-hidden rounded-lg border border-[var(--sw-border)] bg-white">
          <header className="flex items-center justify-between border-b border-[var(--sw-border)] px-[18px] py-3.5">
            <h2 className="text-sm font-bold tracking-tight text-[var(--sw-charcoal)]">
              Ingredients
            </h2>
            <ServingToggle value={servings} onChange={setServings} />
          </header>

          <ul>
            {detail.ingredients.map((ing, i) => {
              const isChecked = checked.has(i);
              return (
                <li
                  key={`${ing.name}-${i}`}
                  className="flex items-center gap-3 border-b border-[var(--sw-border)] px-[18px] py-2.5 last:border-b-0 hover:bg-[var(--sw-page)]"
                >
                  <button
                    type="button"
                    aria-label={isChecked ? `Uncheck ${ing.name}` : `Check ${ing.name}`}
                    aria-pressed={isChecked}
                    onClick={() => toggleCheck(i)}
                    className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border-[1.5px] transition ${
                      isChecked
                        ? "border-[var(--sw-green)] bg-[var(--sw-green)]"
                        : "border-[var(--sw-border)] bg-white"
                    }`}
                  >
                    {isChecked ? (
                      <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                    ) : null}
                  </button>
                  <span className="min-w-[64px] flex-shrink-0 text-xs font-bold text-[var(--sw-charcoal)]">
                    {scaleIngredient(ing, factor)}
                  </span>
                  <span className="flex-1 text-[13px] text-[var(--sw-charcoal)]">
                    {ing.name}
                    {ing.note ? (
                      <span className="ml-1 text-[10.5px] text-[var(--sw-muted)]">
                        · {ing.note}
                      </span>
                    ) : null}
                  </span>
                  <span className="hidden items-center gap-1 whitespace-nowrap rounded-full bg-[rgba(96,178,70,0.1)] px-2 py-0.5 text-[10px] font-semibold text-[var(--sw-green)] sm:flex">
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                    Instamart
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--sw-border)] bg-white px-[18px] py-3.5">
            <AddToPlanButton
              open={planOpen}
              onOpenChange={setPlanOpen}
              onSelect={(label) => {
                setPlanOpen(false);
                flashToast(`Added ${template.dishName} to ${label}`);
              }}
              dishName={template.dishName}
            />
            <button
              type="button"
              onClick={() => setForkOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-[var(--sw-border)] bg-white px-[18px] py-2.5 text-[13px] font-semibold text-[var(--sw-charcoal)] transition hover:bg-[var(--sw-page)]"
            >
              <GitFork className="h-3.5 w-3.5" />
              Fork
            </button>
            <button
              type="button"
              onClick={() =>
                flashToast(`Adding ${detail.ingredients.length} ingredients to Instamart…`)
              }
              className="ml-auto whitespace-nowrap px-3.5 py-2.5 text-xs font-bold text-[var(--sw-orange)] underline underline-offset-2"
            >
              Add to Instamart
            </button>
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-3.5">
          {/* INSTRUCTIONS */}
          <section className="overflow-hidden rounded-lg border border-[var(--sw-border)] bg-white">
            <header className="border-b border-[var(--sw-border)] px-[18px] py-3.5">
              <h2 className="text-sm font-bold tracking-tight text-[var(--sw-charcoal)]">
                Cook Instructions
              </h2>
            </header>
            <ol>
              {detail.steps.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3 border-b border-[var(--sw-border)] px-[18px] py-3 last:border-b-0"
                >
                  <span className="mt-px flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-[var(--sw-charcoal)] text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="text-[12.5px] leading-relaxed text-[var(--sw-charcoal)]">
                    {step.text}
                    {step.tip ? (
                      <span className="mt-1 block text-[11px] text-[var(--sw-muted)]">
                        {step.tip}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* NUTRITION */}
          <section className="rounded-lg border border-[var(--sw-border)] bg-white">
            <header className="flex items-center justify-between border-b border-[var(--sw-border)] px-[18px] py-3.5">
              <h2 className="text-sm font-bold tracking-tight text-[var(--sw-charcoal)]">
                Nutrition{" "}
                <span className="text-xs font-normal text-[var(--sw-muted)]">
                  per {servings === 1 ? "serving" : `${servings} servings`}
                </span>
              </h2>
            </header>
            <div className="grid grid-cols-2 px-3.5 pb-3.5 pt-1">
              <NutBlock value={scaledMacros.kcal.toString()} label="Calories" borderRight />
              <NutBlock value={`${scaledMacros.protein}g`} label="Protein" />
              <NutBlock
                value={`${scaledMacros.carbs}g`}
                label="Carbs"
                borderRight
                borderBottomHidden
              />
              <NutBlock value={`${scaledMacros.fat}g`} label="Fat" borderBottomHidden />
            </div>
          </section>

          {/* SIMILAR */}
          {similar.length > 0 ? (
            <section className="overflow-hidden rounded-lg border border-[var(--sw-border)] bg-white">
              <header className="border-b border-[var(--sw-border)] px-[18px] py-3.5">
                <h2 className="text-sm font-bold tracking-tight text-[var(--sw-charcoal)]">
                  Similar Templates
                </h2>
              </header>
              <ul>
                {similar.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/templates/${s.id}`}
                      className="flex items-center gap-3 border-b border-[var(--sw-border)] px-4 py-2.5 last:border-b-0 hover:bg-[var(--sw-page)]"
                    >
                      <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-md bg-[var(--sw-page)]">
                        <Utensils className="h-4 w-4 text-[var(--sw-border)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-0.5 truncate text-xs font-bold text-[var(--sw-charcoal)]">
                          {s.dishName}
                        </div>
                        <div className="flex items-center gap-1 text-[10.5px] text-[var(--sw-muted)]">
                          <span>{s.tags[0] ?? "Veg"}</span>
                          <span>·</span>
                          <span>{s.kcal} kcal</span>
                          <span>·</span>
                          <span>{s.prepMinutes} min</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10.5px] text-[var(--sw-muted)]">
                        <GitFork className="h-3 w-3" />
                        {s.forkCount}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      {/* FORK MODAL */}
      {forkOpen ? (
        <ForkModal
          dishName={template.dishName}
          onClose={() => setForkOpen(false)}
          onConfirm={() => {
            setForkOpen(false);
            flashToast("Template forked to My Templates");
          }}
        />
      ) : null}

      {/* TOAST */}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 z-[300] flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[var(--sw-charcoal)] px-5 py-2.5 text-xs font-semibold text-white shadow-lg"
        >
          <Check className="h-3.5 w-3.5" />
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function StatBlock({
  value,
  label,
  orange,
  icon,
  last,
}: {
  value: string;
  label: string;
  orange?: boolean;
  icon?: "flame" | "clock";
  last?: boolean;
}) {
  return (
    <div
      className={`flex-1 px-4 py-3.5 text-center ${
        last ? "" : "border-r border-[var(--sw-border)]"
      }`}
    >
      <div
        className={`text-[22px] font-bold leading-none tracking-tight ${
          orange ? "text-[var(--sw-orange)]" : "text-[var(--sw-charcoal)]"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-medium text-[var(--sw-muted)]">
        {icon === "flame" ? <Flame className="h-3 w-3" /> : null}
        {icon === "clock" ? <Clock className="h-3 w-3" /> : null}
        {label}
      </div>
    </div>
  );
}

function NutBlock({
  value,
  label,
  borderRight,
  borderBottomHidden,
}: {
  value: string;
  label: string;
  borderRight?: boolean;
  borderBottomHidden?: boolean;
}) {
  return (
    <div
      className={`px-1 py-2.5 text-center ${
        borderRight ? "border-r border-[var(--sw-border)]" : ""
      } ${borderBottomHidden ? "" : "border-b border-[var(--sw-border)]"}`}
    >
      <div className="text-[19px] font-bold leading-none tracking-tight text-[var(--sw-charcoal)]">
        {value}
      </div>
      <div className="mt-1 text-[9.5px] font-medium text-[var(--sw-muted)]">{label}</div>
    </div>
  );
}

function ServingToggle({
  value,
  onChange,
}: {
  value: ServingOption;
  onChange: (v: ServingOption) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-medium text-[var(--sw-muted)]">Servings</span>
      <div
        role="radiogroup"
        aria-label="Serving size"
        className="flex overflow-hidden rounded-md border-[1.5px] border-[var(--sw-border)]"
      >
        {SERVING_OPTIONS.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt)}
              className={`px-3 py-1 text-xs font-bold transition ${
                active
                  ? "bg-[var(--sw-orange)] text-white"
                  : "bg-[var(--sw-page)] text-[var(--sw-charcoal)] hover:bg-[var(--sw-border)]"
              }`}
            >
              {opt}x
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AddToPlanButton({
  open,
  onOpenChange,
  onSelect,
  dishName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (label: string) => void;
  dishName: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const options = useMemo(
    () =>
      DAY_LABELS.flatMap((day) =>
        MEAL_TYPES.map((meal) => ({
          day,
          meal,
          label: `${day} · ${meal.charAt(0).toUpperCase() + meal.slice(1)}`,
        })),
      ),
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        onOpenChange(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
        buttonRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % options.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + options.length) % options.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const chosen = options[activeIdx];
        if (chosen) onSelect(chosen.label);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange, options, activeIdx, onSelect]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex items-center justify-center gap-1.5 rounded-lg bg-[var(--sw-orange)] px-[18px] py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
      >
        <Calendar className="h-3.5 w-3.5" />
        Add to plan
      </button>
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Add ${dishName} to meal plan`}
          className="absolute left-0 z-[201] mt-2 w-[220px] overflow-hidden rounded-lg border border-[var(--sw-border)] bg-white shadow-xl"
        >
          <div className="border-b border-[var(--sw-border)] px-3.5 py-2.5 text-[11.5px] font-bold text-[var(--sw-charcoal)]">
            Add {dishName} to plan
          </div>
          {DAY_LABELS.map((day) => (
            <div key={day}>
              <div className="px-3.5 pb-0.5 pt-2 text-[9.5px] font-bold uppercase tracking-wider text-[var(--sw-muted)]">
                {day}
              </div>
              {MEAL_TYPES.map((meal) => {
                const idx = options.findIndex((o) => o.day === day && o.meal === meal);
                const label = `${day} · ${meal.charAt(0).toUpperCase() + meal.slice(1)}`;
                const active = idx === activeIdx;
                return (
                  <button
                    key={`${day}-${meal}`}
                    type="button"
                    role="menuitem"
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => onSelect(label)}
                    className={`block w-full px-3.5 py-2 text-left text-xs transition ${
                      active
                        ? "bg-[var(--sw-page)] text-[var(--sw-orange)]"
                        : "text-[var(--sw-charcoal)] hover:bg-[var(--sw-page)] hover:text-[var(--sw-orange)]"
                    }`}
                  >
                    {meal.charAt(0).toUpperCase() + meal.slice(1)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ForkModal({
  dishName,
  onClose,
  onConfirm,
}: {
  dishName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstFocusRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const focusables = [closeBtnRef.current, firstFocusRef.current, confirmBtnRef.current].filter(
          Boolean,
        ) as HTMLButtonElement[];
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 z-[199] bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fork-title"
        aria-describedby="fork-desc"
        className="fixed left-1/2 top-1/2 z-[200] w-[92%] max-w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--sw-border)] bg-white p-7 text-center shadow-2xl"
      >
        <button
          ref={closeBtnRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 text-[var(--sw-muted)] hover:text-[var(--sw-charcoal)]"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mx-auto mb-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[rgba(96,178,70,0.1)]">
          <CheckCircle2 className="h-6 w-6 text-[var(--sw-green)]" />
        </div>
        <h2 id="fork-title" className="mb-1 text-[17px] font-bold text-[var(--sw-charcoal)]">
          Fork this template?
        </h2>
        <p id="fork-desc" className="mb-[18px] text-[12.5px] leading-relaxed text-[var(--sw-muted)]">
          <strong className="font-semibold text-[var(--sw-charcoal)]">{dishName}</strong> will be
          copied into My Templates. You can then edit ingredients and quantities.
        </p>
        <div className="flex gap-2">
          <button
            ref={firstFocusRef}
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border-[1.5px] border-[var(--sw-border)] bg-white px-4 py-2.5 text-[13px] font-semibold text-[var(--sw-charcoal)] transition hover:bg-[var(--sw-page)]"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--sw-orange)] px-4 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Confirm fork
          </button>
        </div>
      </div>
    </>
  );
}
