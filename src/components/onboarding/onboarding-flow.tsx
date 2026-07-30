"use client";

import { useCallback, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  Flame,
  Heart,
  Home,
  Leaf,
  Lock,
  Moon,
  Shield,
  Sprout,
  Tag,
  TrendingDown,
  User,
  Users,
  Utensils,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { isMockMode } from "@/lib/mock";

// ─────────────────────────────────────────────────────────────
// Types & data
// ─────────────────────────────────────────────────────────────

type Goal = "loss" | "gain" | "maintain";
type Diet = "veg" | "nonveg" | "vegan" | "keto" | "jain" | "glutenfree";
type Household = 1 | 2 | 3 | 4;

type State = {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  goal: Goal | null;
  diet: Diet | null;
  hh: Household | null;
  budget: number | null;
  customBudget: boolean;
  excl: string[];
  noExcl: boolean;
};

const STEP_LABELS = [
  "",
  "Your Health Goal",
  "Your Diet Type",
  "Household Size",
  "Monthly Budget",
  "Ingredients to Avoid",
] as const;

const GOAL_OPTIONS: Array<{
  id: Goal;
  icon: LucideIcon;
  title: string;
  popular?: boolean;
  desc: string;
  chips: Array<{ icon: LucideIcon; label: string }>;
}> = [
  {
    id: "loss",
    icon: TrendingDown,
    title: "Lose Weight",
    popular: true,
    desc: "Calorie-controlled plans with high-satiety ingredients. Avg deficit 400–500 kcal/day.",
    chips: [
      { icon: Flame, label: "1,400–1,600 kcal/day" },
      { icon: TrendingDown, label: "Results from week 2" },
    ],
  },
  {
    id: "gain",
    icon: Zap,
    title: "Gain Muscle",
    desc: "High-protein, high-calorie plans. Lean proteins, complex carbs, healthy fats.",
    chips: [
      { icon: Flame, label: "2,200–2,500 kcal/day" },
      { icon: Zap, label: "Protein-first" },
    ],
  },
  {
    id: "maintain",
    icon: Heart,
    title: "Stay Healthy",
    desc: "Balanced, varied meal planning focused on nutrition diversity and consistency.",
    chips: [
      { icon: Flame, label: "1,800–2,000 kcal/day" },
      { icon: Leaf, label: "Balanced macros" },
    ],
  },
];

const DIET_OPTIONS: Array<{ id: Diet; icon: LucideIcon; title: string; desc: string }> = [
  { id: "veg", icon: Leaf, title: "Vegetarian", desc: "No meat · Eggs OK" },
  { id: "nonveg", icon: Utensils, title: "Non-Vegetarian", desc: "All proteins welcome" },
  { id: "vegan", icon: Sprout, title: "Vegan", desc: "No animal products" },
  { id: "keto", icon: Flame, title: "Keto / Low-Carb", desc: "High fat, very low carbs" },
  { id: "jain", icon: Moon, title: "Jain", desc: "No root vegetables" },
  { id: "glutenfree", icon: Shield, title: "Gluten-Free", desc: "No wheat, barley, rye" },
];

const DIET_LABEL: Record<Diet, string> = {
  veg: "Vegetarian",
  nonveg: "Non-Vegetarian",
  vegan: "Vegan",
  keto: "Keto",
  jain: "Jain",
  glutenfree: "Gluten-Free",
};

const HH_OPTIONS: Array<{ id: Household; icon: LucideIcon; label: string; display: string }> = [
  { id: 1, icon: User, label: "Just me", display: "1" },
  { id: 2, icon: Users, label: "Two people", display: "2" },
  { id: 3, icon: Users, label: "Three people", display: "3" },
  { id: 4, icon: Home, label: "Family", display: "4+" },
];

const HH_NOTES: Record<Household, string> = {
  1: "Quantities set for one. Perfect for solo planning.",
  2: "Groceries for two. Great for couples or flatmates.",
  3: "Family quantities with variety.",
  4: "Large household — we'll buy in bulk to save more.",
};

const BUDGET_PRESETS: Array<{ value: number | "custom"; label: string; sub: string }> = [
  { value: 2000, label: "₹2,000", sub: "Basic" },
  { value: 3500, label: "₹3,500", sub: "Standard" },
  { value: 5000, label: "₹5,000", sub: "Comfortable ◆" },
  { value: 8000, label: "₹8,000", sub: "Generous" },
  { value: "custom", label: "Custom", sub: "Set my own" },
];

const BUDGET_ITEMS: Record<number, [string, string, string]> = {
  2000: [
    "3-day restock up to ₹700 per cycle",
    "6–8 meal templates per week",
    "Dal, rice, basic vegetables covered",
  ],
  3500: [
    "3-day restock up to ₹1,150 per cycle",
    "10–12 templates per week",
    "Fruits, dairy, and pantry essentials included",
  ],
  5000: [
    "3-day restock up to ₹1,650 per cycle",
    "Full 7-day meal plan coverage",
    "Premium produce + superfoods included",
  ],
  8000: [
    "3-day restock up to ₹2,600 per cycle",
    "Unlimited templates + eat-out budget",
    "Organic and specialty ingredients available",
  ],
};

const EXCLUSION_OPTIONS: Array<{ id: string; label: string }> = [
  { id: "onion", label: "Onion & Garlic" },
  { id: "nuts", label: "Nuts" },
  { id: "dairy", label: "Dairy" },
  { id: "eggs", label: "Eggs" },
  { id: "fish", label: "Fish & Seafood" },
  { id: "pork", label: "Pork" },
  { id: "beef", label: "Beef" },
  { id: "gluten", label: "Gluten / Wheat" },
  { id: "mushroom", label: "Mushrooms" },
  { id: "soy", label: "Soy" },
];

// ─────────────────────────────────────────────────────────────
// Preview data
// ─────────────────────────────────────────────────────────────

const GOAL_PREVIEW: Record<
  Goal,
  { label: string; sub: string; meals: Array<[string, string, string]>; stats: Array<[string, string]>; tip: string }
> = {
  loss: {
    label: "Lose Weight",
    sub: "Avg 1,450 kcal/day · High-fibre",
    meals: [
      ["High Protein Mornings", "Oats Porridge", "310"],
      ["Weight Loss Week", "Veggie Salad", "240"],
      ["Light Dinners", "Dal Khichdi", "380"],
    ],
    stats: [
      ["Avg grocery spend", "₹3,200–4,500"],
      ["Templates available", "340+"],
      ["Users hit goal", "Week 8–12"],
    ],
    tip: "Next: match recipes to your diet type.",
  },
  gain: {
    label: "Gain Muscle",
    sub: "Avg 2,350 kcal/day · Protein-first",
    meals: [
      ["High Protein Mornings", "Egg White Omelette", "420"],
      ["Muscle Build Plan", "Chicken Rice Bowl", "680"],
      ["Protein Dinners", "Paneer & Lentils", "620"],
    ],
    stats: [
      ["Avg grocery spend", "₹4,500–6,500"],
      ["Templates available", "180+"],
      ["Daily protein", "120–150g"],
    ],
    tip: "Next: set your diet type.",
  },
  maintain: {
    label: "Stay Healthy",
    sub: "Avg 1,900 kcal/day · Balanced",
    meals: [
      ["South Indian Basics", "Upma with Veggies", "280"],
      ["Everyday Indian", "Roti & Dal", "450"],
      ["Light Dinners", "Vegetable Curry", "420"],
    ],
    stats: [
      ["Avg grocery spend", "₹2,800–4,000"],
      ["Templates available", "400+"],
      ["Cuisines", "7 types"],
    ],
    tip: "Next: fine-tune with your diet type.",
  },
};

const DIET_PREVIEW: Record<Diet, { count: string; samples: Array<[string, string]> }> = {
  veg: {
    count: "287",
    samples: [
      ["High Protein Veg", "42 recipes"],
      ["South Indian Basics", "38 recipes"],
      ["Weight Loss Veg", "31 recipes"],
    ],
  },
  nonveg: {
    count: "340",
    samples: [
      ["Chicken Meal Plans", "55 recipes"],
      ["Egg & Protein", "48 recipes"],
      ["Mixed Non-Veg", "62 recipes"],
    ],
  },
  vegan: {
    count: "128",
    samples: [
      ["Plant Protein", "34 recipes"],
      ["Raw Vegan", "18 recipes"],
      ["Oil-Free Cooking", "22 recipes"],
    ],
  },
  keto: {
    count: "96",
    samples: [
      ["Keto Indian", "28 recipes"],
      ["Low-Carb Veg", "24 recipes"],
      ["Keto Snacks", "16 recipes"],
    ],
  },
  jain: {
    count: "110",
    samples: [
      ["Jain Meals", "42 recipes"],
      ["No Root Veg", "28 recipes"],
      ["Festival Special", "18 recipes"],
    ],
  },
  glutenfree: {
    count: "142",
    samples: [
      ["GF Indian", "36 recipes"],
      ["Rice Dishes", "44 recipes"],
      ["Millet Plans", "22 recipes"],
    ],
  },
};

const HH_QUANTITIES: Record<Household, [string, string, string]> = {
  1: ["500g spinach", "250g tomatoes", "1L milk"],
  2: ["1kg spinach", "500g tomatoes", "2L milk"],
  3: ["1.5kg spinach", "750g tomatoes", "3L milk"],
  4: ["2kg spinach", "1kg tomatoes", "4L milk"],
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatRupees(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

function goalLabel(g: Goal | null): string {
  return g ? GOAL_PREVIEW[g].label : "—";
}

function getTemplateCount(exclusionCount: number): number {
  return Math.max(40, 340 - exclusionCount * 28);
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

const initialState: State = {
  step: 1,
  goal: null,
  diet: null,
  hh: null,
  budget: null,
  customBudget: false,
  excl: [],
  noExcl: false,
};

export function OnboardingFlow() {
  const router = useRouter();
  const [state, setState] = useState<State>(initialState);
  const [saving, setSaving] = useState(false);

  const canContinue = useMemo(() => {
    switch (state.step) {
      case 1:
        return state.goal !== null;
      case 2:
        return state.diet !== null;
      case 3:
        return state.hh !== null;
      case 4:
        return state.budget !== null;
      case 5:
        return true; // exclusions can be empty
      default:
        return false;
    }
  }, [state.step, state.goal, state.diet, state.hh, state.budget]);

  const goNext = useCallback(async () => {
    if (state.step === 5) {
      // Submit
      const payload = {
        goal: state.goal,
        diet_type: state.diet,
        household_size: state.hh,
        monthly_budget: state.budget,
        eatout_per_week: null,
        exclusions: state.excl,
      };
      if (isMockMode()) {
        // eslint-disable-next-line no-console
        console.log("[onboarding] mock submit", payload);
        setState((s) => ({ ...s, step: 6 }));
        return;
      }
      setSaving(true);
      try {
        await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } finally {
        setSaving(false);
      }
      setState((s) => ({ ...s, step: 6 }));
      return;
    }
    if (!canContinue) return;
    setState((s) => ({ ...s, step: (s.step + 1) as State["step"] }));
  }, [state, canContinue]);

  const goBack = useCallback(() => {
    setState((s) => (s.step <= 1 ? s : { ...s, step: (s.step - 1) as State["step"] }));
  }, []);

  const finish = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const handleKeyDownAdvance = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && canContinue && state.step !== 6) {
      e.preventDefault();
      void goNext();
    }
  };

  const isComplete = state.step === 6;

  return (
    <div
      className="min-h-screen w-full bg-[var(--sw-page)]"
      onKeyDown={handleKeyDownAdvance}
    >
      <div className="mx-auto flex min-h-screen max-w-[1100px] flex-col items-center px-6 pb-10 pt-7">
        {/* Logo */}
        <div className="mb-5 text-[20px] font-bold tracking-tight text-[var(--sw-charcoal)]">
          Plate<em className="not-italic text-[var(--sw-orange)]">Cart</em>
        </div>

        {/* Progress bar */}
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={Math.min(state.step, 5)}
          aria-label="Onboarding progress"
          className="mb-1.5 flex gap-[5px]"
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-[5px] w-12 rounded-[3px] transition-colors ${
                i <= state.step ? "bg-[var(--sw-orange)]" : "bg-[var(--sw-border)]"
              }`}
            />
          ))}
        </div>
        <div className="mb-[22px] text-xs text-[var(--sw-muted)]">
          {state.step <= 5 ? (
            <>
              Step <strong className="text-[var(--sw-charcoal)]">{state.step}</strong> of 5
              {" · "}
              {STEP_LABELS[state.step as 1 | 2 | 3 | 4 | 5]}
            </>
          ) : (
            <>Setup complete</>
          )}
        </div>

        {/* Layout: left content + right preview */}
        <div className="flex w-full max-w-[960px] flex-col gap-[18px] md:flex-row">
          <div className="min-w-0 flex-1">
            {state.step === 1 && (
              <GoalStep
                selected={state.goal}
                onSelect={(g) => setState((s) => ({ ...s, goal: g }))}
              />
            )}
            {state.step === 2 && (
              <DietStep
                selected={state.diet}
                onSelect={(d) => setState((s) => ({ ...s, diet: d }))}
              />
            )}
            {state.step === 3 && (
              <HouseholdStep
                selected={state.hh}
                onSelect={(h) => setState((s) => ({ ...s, hh: h }))}
              />
            )}
            {state.step === 4 && (
              <BudgetStep
                budget={state.budget}
                custom={state.customBudget}
                onSelectPreset={(v) => {
                  if (v === "custom") {
                    setState((s) => ({ ...s, customBudget: true, budget: s.budget ?? 6000 }));
                  } else {
                    setState((s) => ({ ...s, customBudget: false, budget: v }));
                  }
                }}
                onCustomChange={(v) => setState((s) => ({ ...s, budget: v }))}
              />
            )}
            {state.step === 5 && (
              <ExclusionsStep
                excl={state.excl}
                noExcl={state.noExcl}
                onToggleNone={() =>
                  setState((s) => ({ ...s, noExcl: !s.noExcl, excl: !s.noExcl ? [] : s.excl }))
                }
                onToggleExcl={(label) =>
                  setState((s) => {
                    const has = s.excl.includes(label);
                    const excl = has ? s.excl.filter((e) => e !== label) : [...s.excl, label];
                    return { ...s, excl, noExcl: false };
                  })
                }
              />
            )}
            {state.step === 6 && <CompleteStep state={state} onGo={finish} />}
          </div>

          <aside className="w-full md:w-[272px] md:flex-shrink-0">
            <PreviewPanel state={state} />
          </aside>
        </div>

        {/* Nav */}
        {!isComplete && (
          <div className="mt-[18px] flex w-full max-w-[960px] items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={state.step <= 1}
              className="flex items-center gap-1.5 rounded text-[13px] font-semibold text-[var(--sw-muted)] opacity-55 transition-opacity enabled:hover:text-[var(--sw-charcoal)] enabled:hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-20 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={finish}
              className="text-xs text-[var(--sw-muted)] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] rounded"
            >
              Skip setup
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canContinue || saving}
              className={`flex items-center gap-1.5 rounded-lg px-6 py-[11px] text-[13px] font-bold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2 ${
                canContinue && !saving
                  ? "bg-[var(--sw-orange)] text-white hover:opacity-90"
                  : "cursor-not-allowed border-[1.5px] border-[var(--sw-border)] bg-[var(--sw-page)] text-[var(--sw-muted)]"
              }`}
            >
              {saving ? "Saving…" : state.step === 5 ? "Complete Setup" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step components
// ─────────────────────────────────────────────────────────────

function StepHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <h2 className="mb-[5px] text-[22px] font-bold tracking-tight text-[var(--sw-charcoal)]">
        {title}
      </h2>
      <p className="mb-[18px] text-[13px] leading-relaxed text-[var(--sw-muted)]">{sub}</p>
    </>
  );
}

function GoalStep({
  selected,
  onSelect,
}: {
  selected: Goal | null;
  onSelect: (g: Goal) => void;
}) {
  return (
    <div>
      <StepHeader
        title="What's your health goal?"
        sub="PlateCart builds your grocery list around this. Change it anytime in Settings."
      />
      <div role="radiogroup" aria-label="Health goal" className="flex flex-col gap-[9px]">
        {GOAL_OPTIONS.map((opt) => {
          const isSel = selected === opt.id;
          const Icon = opt.icon;
          return (
            <div
              key={opt.id}
              role="radio"
              aria-checked={isSel}
              tabIndex={0}
              onClick={() => onSelect(opt.id)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onSelect(opt.id);
                }
              }}
              className={`relative flex cursor-pointer items-center gap-3 rounded-lg border-[1.5px] p-[14px_16px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2 ${
                isSel
                  ? "border-[var(--sw-orange)] bg-[var(--sw-orange-tint)]"
                  : "border-[var(--sw-border)] bg-white hover:border-[#C0C0C4] hover:shadow-[0_1px_6px_rgba(40,44,63,0.06)]"
              }`}
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isSel
                    ? "bg-[rgba(252,128,25,0.1)] text-[var(--sw-orange)]"
                    : "bg-[var(--sw-page)] text-[var(--sw-muted)]"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <div className="mb-[3px] flex items-center gap-2">
                  <div className="text-sm font-bold tracking-tight text-[var(--sw-charcoal)]">
                    {opt.title}
                  </div>
                  {opt.popular && (
                    <div className="rounded-full bg-[#FFF0E0] px-[7px] py-[2px] text-[9px] font-bold tracking-wide text-[var(--sw-orange)]">
                      MOST POPULAR
                    </div>
                  )}
                </div>
                <div className="mb-[7px] text-xs leading-snug text-[var(--sw-muted)]">
                  {opt.desc}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {opt.chips.map((chip, idx) => {
                    const ChipIcon = chip.icon;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-1 rounded-full px-2 py-[2px] text-[10px] ${
                          isSel
                            ? "bg-[rgba(252,128,25,0.1)] text-[var(--sw-orange)]"
                            : "bg-[var(--sw-page)] text-[var(--sw-muted)]"
                        }`}
                      >
                        <ChipIcon className="h-3 w-3" strokeWidth={1.75} />
                        {chip.label}
                      </div>
                    );
                  })}
                </div>
              </div>
              {isSel && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--sw-orange)] text-white">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3.5 flex items-center gap-2 text-xs text-[var(--sw-muted)]">
        <div className="flex">
          <SocialAv label="P" />
          <SocialAv label="A" tone="green" />
          <SocialAv label="R" tone="dark" />
        </div>
        <span>
          <strong className="text-[var(--sw-charcoal)]">2,847 users</strong> chose Lose Weight last month
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[var(--sw-muted)]">
        <Lock className="h-4 w-4" strokeWidth={1.75} />
        Your health data stays private — only used to personalise your grocery list.
      </div>
    </div>
  );
}

function SocialAv({ label, tone }: { label: string; tone?: "green" | "dark" }) {
  const bg =
    tone === "green"
      ? "bg-[var(--sw-green)]"
      : tone === "dark"
        ? "bg-[var(--sw-charcoal)]"
        : "bg-[var(--sw-orange)]";
  return (
    <div
      className={`-ml-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[7px] font-bold text-white first:ml-0 ${bg}`}
    >
      {label}
    </div>
  );
}

function DietStep({
  selected,
  onSelect,
}: {
  selected: Diet | null;
  onSelect: (d: Diet) => void;
}) {
  return (
    <div>
      <StepHeader
        title="What's your diet type?"
        sub="Recipes and templates will be filtered to match. Add more exclusions in step 5."
      />
      <div role="radiogroup" aria-label="Diet type" className="grid grid-cols-2 gap-[9px]">
        {DIET_OPTIONS.map((opt) => {
          const isSel = selected === opt.id;
          const Icon = opt.icon;
          return (
            <div
              key={opt.id}
              role="radio"
              aria-checked={isSel}
              tabIndex={0}
              onClick={() => onSelect(opt.id)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onSelect(opt.id);
                }
              }}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg border-[1.5px] p-[13px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2 ${
                isSel
                  ? "border-[var(--sw-orange)] bg-[var(--sw-orange-tint)]"
                  : "border-[var(--sw-border)] bg-white hover:border-[#C0C0C4] hover:bg-[#FAFAFA]"
              }`}
            >
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
                  isSel
                    ? "bg-[rgba(252,128,25,0.1)] text-[var(--sw-orange)]"
                    : "bg-[var(--sw-page)] text-[var(--sw-muted)]"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <div className="mb-[2px] text-[13px] font-bold text-[var(--sw-charcoal)]">
                  {opt.title}
                </div>
                <div className="text-[11px] text-[var(--sw-muted)]">{opt.desc}</div>
              </div>
              <div
                className={`ml-auto flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
                  isSel ? "border-[var(--sw-orange)] bg-[var(--sw-orange)] text-white" : "border-[var(--sw-border)]"
                }`}
              >
                {isSel && <Check className="h-3 w-3" strokeWidth={2.5} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HouseholdStep({
  selected,
  onSelect,
}: {
  selected: Household | null;
  onSelect: (h: Household) => void;
}) {
  return (
    <div>
      <StepHeader
        title="How many people are you cooking for?"
        sub="Grocery quantities and restock amounts scale to your household size."
      />
      <div role="radiogroup" aria-label="Household size" className="flex gap-[9px]">
        {HH_OPTIONS.map((opt) => {
          const isSel = selected === opt.id;
          const Icon = opt.icon;
          return (
            <div
              key={opt.id}
              role="radio"
              aria-checked={isSel}
              tabIndex={0}
              onClick={() => onSelect(opt.id)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onSelect(opt.id);
                }
              }}
              className={`flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-lg border-[1.5px] p-[16px_8px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2 ${
                isSel
                  ? "border-[var(--sw-orange)] bg-[var(--sw-orange-tint)]"
                  : "border-[var(--sw-border)] bg-white hover:border-[#C0C0C4] hover:bg-[#FAFAFA]"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  isSel
                    ? "bg-[rgba(252,128,25,0.1)] text-[var(--sw-orange)]"
                    : "bg-[var(--sw-page)] text-[var(--sw-muted)]"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div
                className={`text-[18px] font-bold tracking-tight ${
                  isSel ? "text-[var(--sw-orange)]" : "text-[var(--sw-charcoal)]"
                }`}
              >
                {opt.display}
              </div>
              <div className="text-center text-[11px] text-[var(--sw-muted)]">{opt.label}</div>
            </div>
          );
        })}
      </div>
      {selected && (
        <div className="mt-3.5 rounded-lg bg-[var(--sw-page)] p-[11px_13px] text-xs leading-relaxed text-[var(--sw-muted)]">
          <strong className="text-[var(--sw-charcoal)]">
            {selected} person{selected > 1 ? "s" : ""}:
          </strong>{" "}
          {HH_NOTES[selected]}
        </div>
      )}
    </div>
  );
}

function BudgetStep({
  budget,
  custom,
  onSelectPreset,
  onCustomChange,
}: {
  budget: number | null;
  custom: boolean;
  onSelectPreset: (v: number | "custom") => void;
  onCustomChange: (v: number) => void;
}) {
  const items = budget ? BUDGET_ITEMS[budget] ?? BUDGET_ITEMS[5000] : null;
  return (
    <div>
      <StepHeader
        title="What's your monthly grocery budget?"
        sub="PlateCart tracks groceries + eat-outs against this limit. Adjust anytime."
      />
      <div className="mb-3.5 flex flex-wrap gap-2">
        {BUDGET_PRESETS.map((preset) => {
          const isSel =
            preset.value === "custom" ? custom : !custom && budget === preset.value;
          return (
            <div
              key={String(preset.value)}
              role="radio"
              aria-checked={isSel}
              tabIndex={0}
              onClick={() => onSelectPreset(preset.value)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onSelectPreset(preset.value);
                }
              }}
              className={`min-w-[90px] flex-1 cursor-pointer rounded-lg border-[1.5px] p-[12px_8px] text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2 ${
                isSel
                  ? "border-[var(--sw-orange)] bg-[var(--sw-orange-tint)]"
                  : "border-[var(--sw-border)] bg-white hover:border-[#C0C0C4] hover:bg-[#FAFAFA]"
              }`}
            >
              <div
                className={`mb-[3px] text-base font-bold tracking-tight ${
                  isSel ? "text-[var(--sw-orange)]" : "text-[var(--sw-charcoal)]"
                }`}
              >
                {preset.label}
              </div>
              <div className="text-[10px] text-[var(--sw-muted)]">{preset.sub}</div>
            </div>
          );
        })}
      </div>
      {custom && (
        <div className="rounded-lg bg-[var(--sw-page)] p-3.5">
          <div className="flex items-center gap-1.5 text-xs text-[var(--sw-muted)]">
            <Wallet className="h-4 w-4" strokeWidth={1.75} />
            Drag to set your custom budget
          </div>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={1000}
              max={20000}
              step={500}
              value={budget ?? 6000}
              onChange={(e) => onCustomChange(Number(e.target.value))}
              aria-label="Custom monthly budget"
              className="h-1 flex-1 accent-[var(--sw-orange)]"
            />
            <div className="min-w-[65px] text-right text-[15px] font-bold text-[var(--sw-orange)]">
              {formatRupees(budget ?? 6000)}
            </div>
          </div>
        </div>
      )}
      {items && (
        <div className="mt-3">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--sw-muted)]">
            What&apos;s covered at this budget
          </div>
          {items.map((line, i) => (
            <div
              key={i}
              className="flex items-start gap-2 border-b border-[var(--sw-border)] py-[7px] text-xs text-[var(--sw-charcoal)] last:border-b-0"
            >
              <div
                className={`mt-[4px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                  i === 2 ? "bg-[var(--sw-orange)]" : "bg-[var(--sw-green)]"
                }`}
              />
              <span>{line}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExclusionsStep({
  excl,
  noExcl,
  onToggleNone,
  onToggleExcl,
}: {
  excl: string[];
  noExcl: boolean;
  onToggleNone: () => void;
  onToggleExcl: (label: string) => void;
}) {
  return (
    <div>
      <StepHeader
        title="Any ingredients to avoid?"
        sub="We'll hide templates containing these. Update this list anytime in Settings."
      />
      <div className="mb-3 rounded-lg bg-[var(--sw-page)] p-[10px_12px] text-xs leading-relaxed text-[var(--sw-muted)]">
        Tap to select ingredients to exclude. Leave empty to see all recipes.
      </div>
      <div
        role="checkbox"
        aria-checked={noExcl}
        tabIndex={0}
        onClick={onToggleNone}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onToggleNone();
          }
        }}
        className={`mb-2.5 flex cursor-pointer items-center gap-2.5 rounded-lg border-[1.5px] p-[11px_13px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2 ${
          noExcl
            ? "border-[var(--sw-orange)] bg-[var(--sw-orange-tint)]"
            : "border-[var(--sw-border)] bg-white hover:border-[#C0C0C4]"
        }`}
      >
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
            noExcl
              ? "bg-[rgba(252,128,25,0.1)] text-[var(--sw-orange)]"
              : "bg-[var(--sw-page)] text-[var(--sw-muted)]"
          }`}
        >
          <Ban className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <div className="text-[13px] font-bold text-[var(--sw-charcoal)]">
            No exclusions — I eat everything
          </div>
          <div className="text-[11px] text-[var(--sw-muted)]">Show me all available recipes</div>
        </div>
        <div
          className={`ml-auto flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
            noExcl ? "border-[var(--sw-orange)] bg-[var(--sw-orange)] text-white" : "border-[var(--sw-border)]"
          }`}
        >
          {noExcl && <Check className="h-3 w-3" strokeWidth={2.5} />}
        </div>
      </div>
      <div className="flex flex-wrap gap-[7px]">
        {EXCLUSION_OPTIONS.map((opt) => {
          const isSel = excl.includes(opt.label);
          return (
            <div
              key={opt.id}
              role="checkbox"
              aria-checked={isSel}
              tabIndex={0}
              onClick={() => onToggleExcl(opt.label)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onToggleExcl(opt.label);
                }
              }}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-3 py-[7px] text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2 ${
                isSel
                  ? "border-[var(--sw-orange)] bg-[var(--sw-orange-tint)] text-[var(--sw-orange)]"
                  : "border-[var(--sw-border)] bg-[var(--sw-page)] text-[var(--sw-charcoal)] hover:border-[#C0C0C4] hover:bg-[#EAEAEE]"
              }`}
            >
              {isSel ? (
                <X className="h-4 w-4 text-[var(--sw-orange)]" strokeWidth={1.75} />
              ) : (
                <Tag className="h-4 w-4 text-[var(--sw-muted)]" strokeWidth={1.75} />
              )}
              {opt.label}
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-[var(--sw-muted)]">
        {excl.length === 0
          ? "No exclusions selected — showing all recipes"
          : `${excl.length} exclusion${excl.length > 1 ? "s" : ""} selected`}
      </div>
    </div>
  );
}

function CompleteStep({ state, onGo }: { state: State; onGo: () => void }) {
  const rows: Array<[string, string, boolean?]> = [
    ["Goal", goalLabel(state.goal)],
    ["Diet Type", state.diet ? DIET_LABEL[state.diet] : "—"],
    ["Household", state.hh ? `${state.hh} person${state.hh > 1 ? "s" : ""}` : "—"],
    ["Monthly Budget", state.budget ? `${formatRupees(state.budget)}/mo` : "—"],
    ["Exclusions", state.excl.length ? state.excl.join(", ") : "None", true],
  ];
  return (
    <div className="py-4 text-center">
      <div className="mx-auto mb-3.5 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[var(--sw-green)] text-white">
        <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />
      </div>
      <h2 className="mb-[5px] text-[21px] font-bold tracking-tight text-[var(--sw-charcoal)]">
        Your PlateCart is ready!
      </h2>
      <p className="mb-5 text-[13px] text-[var(--sw-muted)]">
        Here&apos;s your personalised setup. Edit any of these from Settings.
      </p>
      <div className="mb-[18px] grid grid-cols-2 gap-2 text-left">
        {rows.map(([lbl, val, span], i) => (
          <div
            key={i}
            className={`rounded-lg bg-[var(--sw-page)] p-[11px] ${span ? "col-span-2" : ""}`}
          >
            <div className="mb-1 text-[9.5px] font-bold uppercase tracking-wider text-[var(--sw-muted)]">
              {lbl}
            </div>
            <div className="text-[13px] font-bold text-[var(--sw-charcoal)]">{val}</div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onGo}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--sw-orange)] px-4 py-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2 hover:opacity-90"
      >
        Go to Dashboard
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Preview panel
// ─────────────────────────────────────────────────────────────

function PreviewPanel({ state }: { state: State }) {
  if (state.step === 1) return <PreviewGoal goal={state.goal} />;
  if (state.step === 2) return <PreviewDiet diet={state.diet} />;
  if (state.step === 3) return <PreviewHousehold hh={state.hh} />;
  if (state.step === 4) return <PreviewBudget budget={state.budget} />;
  if (state.step === 5) return <PreviewExclusions excl={state.excl} />;
  return <PreviewComplete />;
}

function PreviewCard({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-4 rounded-lg border border-[var(--sw-border)] bg-white p-4">
      {children}
    </div>
  );
}

function PreviewTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[11px] text-[9.5px] font-bold uppercase tracking-widest text-[var(--sw-muted)]">
      {children}
    </div>
  );
}

function PreviewGoal({ goal }: { goal: Goal | null }) {
  const d = goal ? GOAL_PREVIEW[goal] : null;
  return (
    <PreviewCard>
      <PreviewTitle>Your plan preview</PreviewTitle>
      <div className="mb-[3px] text-sm font-bold tracking-tight text-[var(--sw-charcoal)]">
        {d ? d.label : "Select a goal"}
      </div>
      <div className="mb-3 text-[11px] text-[var(--sw-muted)]">
        {d ? d.sub : "Choose a goal to see a sample meal plan"}
      </div>
      {d && (
        <>
          {d.meals.map((m, i) => (
            <div
              key={i}
              className="mb-[5px] flex items-center gap-2 rounded-md bg-[var(--sw-page)] p-[8px_10px]"
            >
              <div className="flex w-5 flex-shrink-0 items-center justify-center text-[var(--sw-muted)]">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--sw-muted)]" />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold text-[var(--sw-charcoal)]">{m[0]}</div>
                <div className="text-[10px] text-[var(--sw-muted)]">{m[1]}</div>
              </div>
              <div className="whitespace-nowrap text-[11px] font-bold text-[var(--sw-orange)]">
                {m[2]} kcal
              </div>
            </div>
          ))}
          <div className="mt-2.5">
            {d.stats.map((s, i) => (
              <div
                key={i}
                className="flex justify-between border-b border-[var(--sw-border)] py-1.5 text-[11px] last:border-b-0"
              >
                <span className="text-[var(--sw-muted)]">{s[0]}</span>
                <span className="font-bold text-[var(--sw-charcoal)]">{s[1]}</span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 rounded-md bg-[var(--sw-orange-tint)] p-[9px_10px] text-[11px] leading-relaxed text-[var(--sw-charcoal)]">
            <strong className="text-[var(--sw-orange)]">Next:</strong> {d.tip}
          </div>
        </>
      )}
    </PreviewCard>
  );
}

function PreviewDiet({ diet }: { diet: Diet | null }) {
  const d = diet ? DIET_PREVIEW[diet] : null;
  return (
    <PreviewCard>
      <PreviewTitle>Templates available</PreviewTitle>
      <div className="mb-[3px] text-sm font-bold tracking-tight text-[var(--sw-charcoal)]">
        {d ? `${d.count} recipes match` : "Select a diet type"}
      </div>
      <div className="mb-3 text-[11px] text-[var(--sw-muted)]">
        {diet ? `Templates for ${DIET_LABEL[diet]} diet` : "Your templates will be filtered to match"}
      </div>
      {d?.samples.map((s, i) => (
        <div key={i} className="mb-[5px] rounded-md bg-[var(--sw-page)] p-2">
          <div className="text-[11px] font-bold text-[var(--sw-charcoal)]">{s[0]}</div>
          <div className="text-[10px] text-[var(--sw-muted)]">{s[1]}</div>
        </div>
      ))}
      {d && (
        <div className="mt-2 rounded-md bg-[var(--sw-orange-tint)] p-[9px_10px] text-[11px] leading-relaxed text-[var(--sw-charcoal)]">
          <strong className="text-[var(--sw-orange)]">Next:</strong> Set quantities for your household.
        </div>
      )}
    </PreviewCard>
  );
}

function PreviewHousehold({ hh }: { hh: Household | null }) {
  const HHIcon: LucideIcon = hh
    ? hh === 1
      ? User
      : hh === 4
        ? Home
        : Users
    : Users;
  return (
    <PreviewCard>
      <PreviewTitle>Grocery quantities</PreviewTitle>
      <div className="mb-[3px] text-sm font-bold tracking-tight text-[var(--sw-charcoal)]">
        {hh ? `Quantities for ${hh} person${hh > 1 ? "s" : ""}` : "Select household size"}
      </div>
      <div className="mb-3 text-[11px] text-[var(--sw-muted)]">
        {hh ? "Sample 3-day restock" : "Quantities scale per person"}
      </div>
      {hh && (
        <>
          <div className="mx-auto my-2.5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sw-page)] text-[var(--sw-orange)]">
            <HHIcon className="h-6 w-6" strokeWidth={1.75} />
          </div>
          {HH_QUANTITIES[hh].map((q, i) => (
            <div
              key={i}
              className="mb-[5px] flex items-center gap-2 rounded-md bg-[var(--sw-page)] p-[8px_10px]"
            >
              <Tag className="h-4 w-4 flex-shrink-0 text-[var(--sw-muted)]" strokeWidth={1.75} />
              <div className="flex-1">
                <div className="text-[11px] font-bold text-[var(--sw-charcoal)]">{q}</div>
                <div className="text-[10px] text-[var(--sw-muted)]">Per 3-day cycle</div>
              </div>
            </div>
          ))}
          <div className="mt-2 rounded-md bg-[var(--sw-orange-tint)] p-[9px_10px] text-[11px] leading-relaxed text-[var(--sw-charcoal)]">
            <strong className="text-[var(--sw-orange)]">Next:</strong> Set your monthly budget.
          </div>
        </>
      )}
    </PreviewCard>
  );
}

function PreviewBudget({ budget }: { budget: number | null }) {
  const b = budget ?? 0;
  const gr = Math.round(b * 0.6);
  const eo = Math.round(b * 0.3);
  const sn = Math.round(b * 0.1);
  return (
    <PreviewCard>
      <PreviewTitle>Budget breakdown</PreviewTitle>
      <div className="mb-[3px] text-sm font-bold tracking-tight text-[var(--sw-charcoal)]">
        {budget ? `${formatRupees(budget)}/month` : "Select a budget"}
      </div>
      <div className="mb-3 text-[11px] text-[var(--sw-muted)]">
        {budget ? "How your budget is allocated" : "See how your budget is allocated"}
      </div>
      {budget && (
        <>
          <BudgetBar label="Groceries (60%)" width="60%" color="var(--sw-orange)" amount={gr} />
          <BudgetBar label="Eat-outs (30%)" width="30%" color="var(--sw-charcoal)" amount={eo} />
          <BudgetBar label="Buffer (10%)" width="10%" color="var(--sw-green)" amount={sn} />
          <div className="mt-2.5 rounded-md bg-[var(--sw-orange-tint)] p-[9px_10px] text-[11px] leading-relaxed text-[var(--sw-charcoal)]">
            <strong className="text-[var(--sw-orange)]">Next:</strong> Add any ingredient exclusions.
          </div>
        </>
      )}
    </PreviewCard>
  );
}

function BudgetBar({
  label,
  width,
  color,
  amount,
}: {
  label: string;
  width: string;
  color: string;
  amount: number;
}) {
  return (
    <div className="mb-2">
      <div className="mb-[3px] text-[10px] text-[var(--sw-muted)]">{label}</div>
      <div className="h-[5px] overflow-hidden rounded-[3px] bg-[var(--sw-border)]">
        <div
          className="h-full rounded-[3px] transition-all"
          style={{ width, background: color }}
        />
      </div>
      <div className="mt-0.5 text-xs font-bold text-[var(--sw-charcoal)]">
        {formatRupees(amount)}
      </div>
    </div>
  );
}

function PreviewExclusions({ excl }: { excl: string[] }) {
  const cnt = getTemplateCount(excl.length);
  return (
    <PreviewCard>
      <PreviewTitle>Your recipe library</PreviewTitle>
      <div className="mb-[3px] text-sm font-bold tracking-tight text-[var(--sw-charcoal)]">
        {cnt} recipes available
      </div>
      <div className="mb-3 text-[11px] text-[var(--sw-muted)]">
        {excl.length
          ? `${excl.length} ingredient${excl.length > 1 ? "s" : ""} excluded`
          : "No exclusions — full library"}
      </div>
      <div className="rounded-md bg-[var(--sw-page)] p-2">
        <div className="text-[11px] font-bold text-[var(--sw-charcoal)]">Templates matched</div>
        <div className="text-[10px] text-[var(--sw-muted)]">{cnt} of 340 in your library</div>
      </div>
      {excl.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {excl.map((e) => (
            <span
              key={e}
              className="flex items-center gap-1 rounded-full bg-[#FEE2E2] px-2 py-[2px] text-[10px] text-[#DC2626]"
            >
              <X className="h-3 w-3" strokeWidth={2} />
              {e}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2.5 rounded-md bg-[var(--sw-orange-tint)] p-[9px_10px] text-[11px] leading-relaxed text-[var(--sw-charcoal)]">
        <strong className="text-[var(--sw-orange)]">Tip:</strong> Add more exclusions in Settings anytime after setup.
      </div>
    </PreviewCard>
  );
}

function PreviewComplete() {
  return (
    <PreviewCard>
      <div className="py-2 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--sw-green)]">
          <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <div className="mb-[3px] text-sm font-bold tracking-tight text-[var(--sw-charcoal)]">
          Setup complete!
        </div>
        <div className="mb-3 text-[11px] text-[var(--sw-muted)]">
          Your first grocery list will be ready after you build your meal plan.
        </div>
        <div className="rounded-lg bg-[var(--sw-page)] p-[11px] text-left text-[11px] leading-relaxed text-[var(--sw-muted)]">
          <strong className="text-[var(--sw-charcoal)]">What happens next:</strong>
          <br />
          1. Pick this week&apos;s meal templates
          <br />
          2. Voice-order or manually add to cart
          <br />
          3. Confirm your Instamart order
        </div>
      </div>
    </PreviewCard>
  );
}
