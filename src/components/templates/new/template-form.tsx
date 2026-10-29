"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Globe,
  Info,
  Leaf,
  Lock,
  Plus,
  Send,
  X,
} from "lucide-react";

import { PreviewPanel } from "./preview-panel";
import type {
  DietTag,
  Difficulty,
  GoalTag,
  IngredientRow,
  MealType,
  StepRow,
  TemplateDraft,
  TemplatePayload,
  Unit,
  Visibility,
} from "./types";

const DRAFT_KEY = "platecart_draft";
const UNITS: Unit[] = ["g", "kg", "ml", "l", "tsp", "tbsp", "pc", "cup"];

const DIET_OPTIONS: Array<{ key: DietTag; label: string; leaf?: boolean }> = [
  { key: "veg", label: "Vegetarian", leaf: true },
  { key: "nonveg", label: "Non-Veg" },
  { key: "vegan", label: "Vegan" },
  { key: "keto", label: "Keto" },
  { key: "jain", label: "Jain" },
  { key: "glutenfree", label: "Gluten-Free" },
];

const GOAL_OPTIONS: Array<{ key: GoalTag; label: string }> = [
  { key: "weight-loss", label: "Weight Loss" },
  { key: "muscle-gain", label: "Muscle Gain" },
  { key: "maintain", label: "Maintain" },
  { key: "protein", label: "High Protein" },
  { key: "light", label: "Light <300 kcal" },
  { key: "quick", label: "Quick <15 min" },
];

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function initialDraft(): TemplateDraft {
  return {
    dishName: "",
    mealType: "",
    servings: 2,
    prepMinutes: 0,
    difficulty: "easy",
    costPerServing: "",
    diet: "veg",
    goalTags: [],
    ingredients: [
      { id: makeId(), name: "", qty: "", unit: "g" },
      { id: makeId(), name: "", qty: "", unit: "g" },
    ],
    steps: [{ id: makeId(), text: "" }],
    visibility: "public",
  };
}

type Action =
  | { type: "set"; patch: Partial<TemplateDraft> }
  | { type: "hydrate"; draft: TemplateDraft }
  | { type: "ing:add" }
  | { type: "ing:remove"; id: string }
  | { type: "ing:update"; id: string; patch: Partial<IngredientRow> }
  | { type: "step:add" }
  | { type: "step:remove"; id: string }
  | { type: "step:update"; id: string; text: string }
  | { type: "goal:toggle"; key: GoalTag };

function reducer(state: TemplateDraft, action: Action): TemplateDraft {
  switch (action.type) {
    case "set":
      return { ...state, ...action.patch };
    case "hydrate":
      return action.draft;
    case "ing:add":
      return {
        ...state,
        ingredients: [
          ...state.ingredients,
          { id: makeId(), name: "", qty: "", unit: "g" },
        ],
      };
    case "ing:remove":
      return {
        ...state,
        ingredients:
          state.ingredients.length > 1
            ? state.ingredients.filter((i) => i.id !== action.id)
            : state.ingredients,
      };
    case "ing:update":
      return {
        ...state,
        ingredients: state.ingredients.map((i) =>
          i.id === action.id ? { ...i, ...action.patch } : i,
        ),
      };
    case "step:add":
      return {
        ...state,
        steps: [...state.steps, { id: makeId(), text: "" }],
      };
    case "step:remove":
      return {
        ...state,
        steps:
          state.steps.length > 1
            ? state.steps.filter((s) => s.id !== action.id)
            : state.steps,
      };
    case "step:update":
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.id === action.id ? { ...s, text: action.text } : s,
        ),
      };
    case "goal:toggle":
      return {
        ...state,
        goalTags: state.goalTags.includes(action.key)
          ? state.goalTags.filter((g) => g !== action.key)
          : [...state.goalTags, action.key],
      };
    default:
      return state;
  }
}

type ValidationResult = {
  valid: boolean;
  nameError: string | null;
  ingredientsError: string | null;
  stepsError: string | null;
};

function validate(draft: TemplateDraft): ValidationResult {
  const name = draft.dishName.trim();
  let nameError: string | null = null;
  if (name.length === 0) nameError = "Dish name is required";
  else if (name.length < 3) nameError = "At least 3 characters";
  else if (name.length > 60) nameError = "Max 60 characters";

  const filledIng = draft.ingredients.filter((i) => i.name.trim().length > 0);
  const ingredientsError =
    filledIng.length === 0 ? "Add at least one ingredient" : null;

  const filledStep = draft.steps.filter((s) => s.text.trim().length > 0);
  const stepsError =
    filledStep.length === 0 ? "Add at least one instruction step" : null;

  return {
    valid: !nameError && !ingredientsError && !stepsError,
    nameError,
    ingredientsError,
    stepsError,
  };
}

function toPayload(draft: TemplateDraft): TemplatePayload {
  return {
    dish_name: draft.dishName.trim(),
    meal_type: draft.mealType,
    diet_type: draft.diet,
    prep_minutes: draft.prepMinutes,
    default_servings: draft.servings,
    difficulty: draft.difficulty,
    cost_per_serving_inr: draft.costPerServing
      ? Number(draft.costPerServing)
      : null,
    is_public: draft.visibility === "public",
    goal_tags: draft.goalTags,
    ingredients: draft.ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({ name: i.name.trim(), qty: i.qty.trim(), unit: i.unit })),
    instructions: draft.steps
      .filter((s) => s.text.trim())
      .map((s, idx) => ({ step_number: idx + 1, text: s.text.trim() })),
  };
}

export function TemplateForm({ mockMode }: { mockMode: boolean }) {
  const router = useRouter();
  const [draft, dispatch] = useReducer(reducer, undefined, initialDraft);
  const [toast, setToast] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TemplateDraft;
        if (parsed && typeof parsed === "object" && parsed.dishName !== undefined) {
          dispatch({ type: "hydrate", draft: parsed });
          setSavedAt(new Date());
        }
      }
    } catch {
      // ignore parse errors
    }
    hydrated.current = true;
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const persistDraft = useCallback(
    (silent: boolean) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setSavedAt(new Date());
        if (!silent) showToast("Draft saved");
      } catch {
        if (!silent) showToast("Could not save draft");
      }
    },
    [draft, showToast],
  );

  // Auto-save every 30s
  useEffect(() => {
    const id = setInterval(() => {
      if (hydrated.current) persistDraft(true);
    }, 30000);
    return () => clearInterval(id);
  }, [persistDraft]);

  const validation = useMemo(() => validate(draft), [draft]);

  const handlePublish = async () => {
    if (!validation.valid) {
      setShowValidation(true);
      return;
    }
    const payload = toPayload(draft);
    setPublishing(true);
    try {
      if (mockMode) {
        // eslint-disable-next-line no-console
        console.log("[mock] POST /api/templates", payload);
        await new Promise((r) => setTimeout(r, 350));
        showToast("Template published");
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          // ignore
        }
        router.push("/my-templates");
      } else {
        const res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showToast("Template published");
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          // ignore
        }
        router.push("/my-templates");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Publish failed");
      setPublishing(false);
    }
  };

  const nameHint = showValidation ? validation.nameError : null;
  const ingHint = showValidation ? validation.ingredientsError : null;
  const stepHint = showValidation ? validation.stepsError : null;

  return (
    <div className="mx-auto max-w-[1160px] px-5 pb-16 pt-5">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--sw-charcoal)]">
            Create a template
          </h1>
          <p className="mt-0.5 text-[12.5px] text-[var(--sw-muted)]">
            Build a reusable dish — ingredients become an Instamart cart
          </p>
        </div>
        {savedAt ? (
          <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--sw-muted)]">
            <Check className="h-3 w-3 text-[var(--sw-green)]" />
            Draft saved
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          {/* Basics */}
          <Section title="Template basics">
            <div>
              <Label required>Dish name</Label>
              <input
                type="text"
                value={draft.dishName}
                onChange={(e) =>
                  dispatch({ type: "set", patch: { dishName: e.target.value } })
                }
                maxLength={60}
                placeholder="e.g. Dal Khichdi, Oats Porridge, Grilled Tofu Bowl"
                aria-invalid={nameHint ? true : undefined}
                aria-describedby={nameHint ? "dish-name-hint" : undefined}
                className={inputCls}
              />
              {nameHint ? (
                <p id="dish-name-hint" className="mt-1 text-xs text-[#DC2626]">
                  {nameHint}
                </p>
              ) : null}
            </div>
            <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <Label required>Meal type</Label>
                <select
                  value={draft.mealType}
                  onChange={(e) =>
                    dispatch({
                      type: "set",
                      patch: { mealType: e.target.value as MealType },
                    })
                  }
                  className={inputCls}
                >
                  <option value="">Select…</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                  <option value="any">Any meal</option>
                </select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <select
                  value={draft.difficulty}
                  onChange={(e) =>
                    dispatch({
                      type: "set",
                      patch: { difficulty: e.target.value as Difficulty },
                    })
                  }
                  className={inputCls}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div>
                <Label required>Prep time (min)</Label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={draft.prepMinutes || ""}
                  onChange={(e) =>
                    dispatch({
                      type: "set",
                      patch: { prepMinutes: Number(e.target.value) || 0 },
                    })
                  }
                  placeholder="20"
                  className={inputCls}
                />
              </div>
              <div>
                <Label>Default servings</Label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={draft.servings || ""}
                  onChange={(e) =>
                    dispatch({
                      type: "set",
                      patch: { servings: Number(e.target.value) || 1 },
                    })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <Label>Est. cost / serving (₹)</Label>
                <input
                  type="number"
                  min={0}
                  value={draft.costPerServing}
                  onChange={(e) =>
                    dispatch({
                      type: "set",
                      patch: { costPerServing: e.target.value },
                    })
                  }
                  placeholder="e.g. 45"
                  className={inputCls}
                />
              </div>
            </div>
          </Section>

          {/* Diet & Goal */}
          <Section title="Diet & goal tags">
            <div>
              <Label required>Diet type</Label>
              <div role="group" aria-label="Diet type" className="flex flex-wrap gap-1.5">
                {DIET_OPTIONS.map((opt) => {
                  const selected = draft.diet === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        dispatch({ type: "set", patch: { diet: opt.key } })
                      }
                      className={chipCls(selected, opt.key === "veg")}
                    >
                      {opt.leaf ? (
                        <Leaf
                          className={`h-3 w-3 ${
                            selected ? "text-[var(--sw-green)]" : "text-[var(--sw-muted)]"
                          }`}
                        />
                      ) : null}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-3.5">
              <Label>Goal tags (select all that apply)</Label>
              <div role="group" aria-label="Goal tags" className="flex flex-wrap gap-1.5">
                {GOAL_OPTIONS.map((opt) => {
                  const selected = draft.goalTags.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        dispatch({ type: "goal:toggle", key: opt.key })
                      }
                      className={chipCls(selected, false)}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--sw-muted)]">
                <Info className="h-3 w-3" />
                Goal tags auto-suggested based on kcal once you add ingredients
              </p>
            </div>
          </Section>

          {/* Ingredients */}
          <div className="overflow-hidden rounded-lg glass">
            <div className="flex items-center justify-between border-b border-[var(--sw-border)] px-[18px] py-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-[13px] font-bold text-[var(--sw-charcoal)]">
                  Ingredients
                </h2>
                <span className="text-xs text-[var(--sw-muted)]">per serving</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[var(--sw-muted)]">
                <Info className="h-3 w-3" />
                Search from Instamart catalog
              </div>
            </div>
            <div className="flex flex-col">
              {draft.ingredients.map((row, idx) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_80px_90px_32px] items-center gap-1.5 border-b border-[var(--sw-border)] px-[18px] py-2 last:border-b-0"
                >
                  <label className="sr-only" htmlFor={`ing-name-${row.id}`}>
                    Ingredient {idx + 1} name
                  </label>
                  <input
                    id={`ing-name-${row.id}`}
                    type="text"
                    value={row.name}
                    onChange={(e) =>
                      dispatch({
                        type: "ing:update",
                        id: row.id,
                        patch: { name: e.target.value },
                      })
                    }
                    placeholder="e.g. Yellow moong dal"
                    className={smallInputCls}
                  />
                  <label className="sr-only" htmlFor={`ing-qty-${row.id}`}>
                    Ingredient {idx + 1} quantity
                  </label>
                  <input
                    id={`ing-qty-${row.id}`}
                    type="text"
                    value={row.qty}
                    onChange={(e) =>
                      dispatch({
                        type: "ing:update",
                        id: row.id,
                        patch: { qty: e.target.value },
                      })
                    }
                    placeholder="80"
                    className={`${smallInputCls} text-center`}
                  />
                  <label className="sr-only" htmlFor={`ing-unit-${row.id}`}>
                    Ingredient {idx + 1} unit
                  </label>
                  <select
                    id={`ing-unit-${row.id}`}
                    value={row.unit}
                    onChange={(e) =>
                      dispatch({
                        type: "ing:update",
                        id: row.id,
                        patch: { unit: e.target.value as Unit },
                      })
                    }
                    className={smallInputCls}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label={`Remove ingredient ${idx + 1}`}
                    onClick={() => dispatch({ type: "ing:remove", id: row.id })}
                    disabled={draft.ingredients.length <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--sw-muted)] transition-colors hover:bg-[var(--sw-page)] hover:text-[#DC2626] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              aria-label="Add ingredient"
              onClick={() => dispatch({ type: "ing:add" })}
              className="flex w-full items-center gap-1.5 px-[18px] py-2.5 text-[12.5px] font-semibold text-[var(--sw-orange)] transition-colors hover:bg-[var(--sw-page)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add ingredient
            </button>
            {ingHint ? (
              <p className="border-t border-[var(--sw-border)] px-[18px] py-2 text-xs text-[#DC2626]">
                {ingHint}
              </p>
            ) : null}
          </div>

          {/* Instructions */}
          <div className="overflow-hidden rounded-lg glass">
            <div className="border-b border-[var(--sw-border)] px-[18px] py-3">
              <h2 className="text-[13px] font-bold text-[var(--sw-charcoal)]">
                Cook instructions
              </h2>
            </div>
            <div className="flex flex-col">
              {draft.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="grid grid-cols-[26px_1fr_28px] items-start gap-2 border-b border-[var(--sw-border)] px-[18px] py-2 last:border-b-0"
                >
                  <div className="mt-1.5 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[var(--sw-charcoal)] text-[10px] font-bold text-white">
                    {idx + 1}
                  </div>
                  <label className="sr-only" htmlFor={`step-${step.id}`}>
                    Step {idx + 1}
                  </label>
                  <textarea
                    id={`step-${step.id}`}
                    value={step.text}
                    onChange={(e) =>
                      dispatch({
                        type: "step:update",
                        id: step.id,
                        text: e.target.value,
                      })
                    }
                    placeholder={`Step ${idx + 1} — describe what to do…`}
                    rows={2}
                    className="w-full resize-none rounded-md border-[1.5px] border-[var(--sw-border)] bg-[var(--sw-page)] px-2.5 py-1.5 text-[12.5px] leading-relaxed text-[var(--sw-charcoal)] outline-none transition-colors placeholder:text-[#B0B3BB] focus:border-[var(--sw-orange)] focus:bg-white"
                  />
                  <button
                    type="button"
                    aria-label={`Remove step ${idx + 1}`}
                    onClick={() => dispatch({ type: "step:remove", id: step.id })}
                    disabled={draft.steps.length <= 1}
                    className="mt-1 flex h-7 w-7 items-center justify-center rounded-full text-[var(--sw-muted)] transition-colors hover:bg-[var(--sw-page)] hover:text-[#DC2626] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              aria-label="Add step"
              onClick={() => dispatch({ type: "step:add" })}
              className="flex w-full items-center gap-1.5 px-[18px] py-2.5 text-[12.5px] font-semibold text-[var(--sw-orange)] transition-colors hover:bg-[var(--sw-page)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add step
            </button>
            {stepHint ? (
              <p className="border-t border-[var(--sw-border)] px-[18px] py-2 text-xs text-[#DC2626]">
                {stepHint}
              </p>
            ) : null}
          </div>

          {/* Visibility */}
          <Section title="Visibility">
            <div
              role="group"
              aria-label="Visibility"
              className="flex w-fit overflow-hidden rounded-lg border-[1.5px] border-[var(--sw-border)]"
            >
              <VisButton
                active={draft.visibility === "public"}
                onClick={() =>
                  dispatch({ type: "set", patch: { visibility: "public" } })
                }
                icon={<Globe className="h-3 w-3" />}
                label="Public"
              />
              <VisButton
                active={draft.visibility === "private"}
                onClick={() =>
                  dispatch({ type: "set", patch: { visibility: "private" } })
                }
                icon={<Lock className="h-3 w-3" />}
                label="Private"
              />
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-[var(--sw-muted)]">
              {draft.visibility === "public"
                ? "Public templates appear in the template browser. Others can fork your recipe. You keep attribution."
                : "Only you can see this template. Change to public anytime to share with the community."}
            </p>
          </Section>

          {/* Action bar */}
          <div className="flex flex-col items-stretch justify-between gap-3 rounded-lg glass px-4 py-3.5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-1.5 text-xs text-[var(--sw-muted)]">
              <Info className="h-3 w-3" />
              <span>
                {validation.valid ? (
                  <>
                    Ready to publish as{" "}
                    <b className="text-[var(--sw-charcoal)]">
                      {draft.visibility === "public" ? "public" : "private"}
                    </b>{" "}
                    template
                  </>
                ) : (
                  "Fill in dish name, at least one ingredient and one step to publish"
                )}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => persistDraft(false)}
                className="rounded-lg border-[1.5px] border-[var(--sw-border)] bg-[var(--sw-page)] px-4 py-2.5 text-[13px] font-semibold text-[var(--sw-charcoal)] transition-colors hover:border-[var(--sw-charcoal)]"
              >
                Save draft
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={!validation.valid || publishing}
                className="flex items-center gap-1.5 rounded-lg bg-appetite px-6 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[var(--sw-border)] disabled:text-[var(--sw-muted)]"
              >
                <Send className="h-3.5 w-3.5" />
                {publishing ? "Publishing…" : "Publish template"}
              </button>
            </div>
          </div>
        </div>

        <PreviewPanel draft={draft} />
      </div>

      {/* Toast */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-16 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--sw-charcoal)] px-5 py-2.5 text-xs font-semibold text-white transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
        }`}
      >
        <Check className="h-3.5 w-3.5" />
        <span>{toast ?? ""}</span>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border-[1.5px] border-[var(--sw-border)] bg-[var(--sw-page)] px-3 py-2 text-[13px] text-[var(--sw-charcoal)] outline-none transition-colors placeholder:text-[#B0B3BB] focus:border-[var(--sw-orange)] focus:bg-white";

const smallInputCls =
  "w-full rounded-md border-[1.5px] border-[var(--sw-border)] bg-[var(--sw-page)] px-2.5 py-1.5 text-[12.5px] text-[var(--sw-charcoal)] outline-none transition-colors placeholder:text-[#B0B3BB] focus:border-[var(--sw-orange)] focus:bg-white";

function chipCls(selected: boolean, greenAccent: boolean): string {
  if (selected && greenAccent) {
    return "flex items-center gap-1 rounded-full border-[1.5px] border-[var(--sw-green)] bg-[rgba(96,178,70,0.1)] px-3 py-1.5 text-xs font-semibold text-[var(--sw-green)] transition-colors";
  }
  if (selected) {
    return "flex items-center gap-1 rounded-full border-[1.5px] border-[var(--sw-orange)] bg-[var(--sw-orange-tint)] px-3 py-1.5 text-xs font-semibold text-[var(--sw-orange)] transition-colors";
  }
  return "flex items-center gap-1 rounded-full border-[1.5px] border-[var(--sw-border)] bg-white/70 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-[var(--sw-muted)] transition-colors hover:border-[#C0C0C4] hover:text-[var(--sw-charcoal)]";
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg glass">
      <div className="border-b border-[var(--sw-border)] px-[18px] py-3">
        <h2 className="text-[13px] font-bold text-[var(--sw-charcoal)]">
          {title}
        </h2>
      </div>
      <div className="px-[18px] py-4">{children}</div>
    </div>
  );
}

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--sw-muted)]">
      {children}
      {required ? (
        <span className="text-sm text-[var(--sw-orange)]">*</span>
      ) : null}
    </div>
  );
}

function VisButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-[var(--sw-charcoal)] text-white"
          : "bg-white/70 backdrop-blur-md text-[var(--sw-muted)] hover:text-[var(--sw-charcoal)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
