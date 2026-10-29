"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";

import { saveDish, type DishInput } from "@/lib/actions/dishes";
import { DIET_LABEL, DIETS, MEAL_LABEL, MEALS, type Diet, type Meal } from "@/lib/labels";

type Ingredient = { name: string; quantity: string; unit: string };

export type DishFormValues = {
  id: string | null;
  name: string;
  description: string;
  diet: Diet;
  meal_types: Meal[];
  cook_minutes: string;
  steps: string;
  tags: string;
  is_public: boolean;
  ingredients: Ingredient[];
};

const UNITS = ["", "g", "kg", "ml", "l", "cup", "tbsp", "tsp", "pc", "bunch", "clove", "inch", "slice", "pinch"];

export function DishForm({ initial }: { initial: DishFormValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof DishFormValues>(k: K, val: DishFormValues[K]) => setV((s) => ({ ...s, [k]: val }));
  const setIng = (i: number, patch: Partial<Ingredient>) =>
    set("ingredients", v.ingredients.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: DishInput = {
      id: v.id,
      name: v.name,
      description: v.description,
      diet: v.diet,
      meal_types: v.meal_types,
      cook_minutes: v.cook_minutes,
      steps: v.steps,
      tags: v.tags.split(","),
      is_public: v.is_public,
      ingredients: v.ingredients.filter((i) => i.name.trim()),
    };
    startTransition(async () => {
      const res = await saveDish(payload);
      if (res.ok) router.push(`/dishes/${res.data}`);
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="surface-solid space-y-6 p-5 sm:p-6" noValidate>
      <div>
        <label htmlFor="name" className="label">Dish name</label>
        <input id="name" required minLength={2} maxLength={80} value={v.name} onChange={(e) => set("name", e.target.value)} className="input" placeholder="e.g. Amma's Sambar" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="diet" className="label">Diet</label>
          <select id="diet" value={v.diet} onChange={(e) => set("diet", e.target.value as Diet)} className="input">
            {DIETS.map((d) => (
              <option key={d} value={d}>{DIET_LABEL[d]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cook" className="label">Cooking time <span className="font-normal text-ink-muted">(minutes)</span></label>
          <input id="cook" inputMode="numeric" value={v.cook_minutes} onChange={(e) => set("cook_minutes", e.target.value.replace(/\D/g, "").slice(0, 3))} className="input" />
        </div>
      </div>

      <fieldset>
        <legend className="label">Good for</legend>
        <div className="flex flex-wrap gap-2">
          {MEALS.map((m) => {
            const on = v.meal_types.includes(m);
            return (
              <button key={m} type="button" className="chip" aria-pressed={on} onClick={() => set("meal_types", on ? v.meal_types.filter((x) => x !== m) : [...v.meal_types, m])}>
                {MEAL_LABEL[m]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Ingredients <span className="font-normal text-ink-muted">(for 2 people, optional)</span></legend>
        <div className="space-y-2">
          {v.ingredients.map((ing, i) => (
            <div key={i} className="grid grid-cols-[1fr_72px_88px_44px] gap-2">
              <input aria-label={`Ingredient ${i + 1}`} value={ing.name} maxLength={60} onChange={(e) => setIng(i, { name: e.target.value })} className="input" placeholder="Ingredient" />
              <input aria-label="Quantity" inputMode="decimal" value={ing.quantity} onChange={(e) => setIng(i, { quantity: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })} className="input px-2" placeholder="Qty" />
              <select aria-label="Unit" value={ing.unit} onChange={(e) => setIng(i, { unit: e.target.value })} className="input px-2">
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u || "unit"}</option>
                ))}
              </select>
              <button type="button" aria-label="Remove ingredient" className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-muted hover:bg-fill-subtle hover:text-danger" onClick={() => set("ingredients", v.ingredients.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {v.ingredients.length < 40 && (
          <button type="button" className="btn-ghost btn-sm mt-2" onClick={() => set("ingredients", [...v.ingredients, { name: "", quantity: "", unit: "" }])}>
            <Plus className="h-4 w-4" /> Add ingredient
          </button>
        )}
      </fieldset>

      <div>
        <label htmlFor="steps" className="label">How to make it <span className="font-normal text-ink-muted">(optional)</span></label>
        <textarea id="steps" rows={6} maxLength={4000} value={v.steps} onChange={(e) => set("steps", e.target.value)} className="input py-2 leading-relaxed" placeholder={"1. Soak the dal for 30 minutes\n2. …"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="description" className="label">Short description <span className="font-normal text-ink-muted">(optional)</span></label>
          <input id="description" maxLength={500} value={v.description} onChange={(e) => set("description", e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="tags" className="label">Tags <span className="font-normal text-ink-muted">(comma separated)</span></label>
          <input id="tags" maxLength={120} value={v.tags} onChange={(e) => set("tags", e.target.value)} className="input" placeholder="quick, high-protein" />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-hairline p-3">
        <input type="checkbox" checked={v.is_public} onChange={(e) => set("is_public", e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--ink-orange)]" />
        <span>
          <span className="block font-semibold">Share with the community</span>
          <span className="block text-sm text-ink-muted">Others can find this dish and copy it. You can turn this off later.</span>
        </span>
      </label>

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={pending || v.name.trim().length < 2}>
          {pending ? "Saving…" : v.id ? "Save changes" : "Save dish"}
        </button>
      </div>
    </form>
  );
}
