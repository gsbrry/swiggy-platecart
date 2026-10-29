"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";

import { completeOnboarding } from "@/lib/actions/profile";
import { DIET_LABEL, DIETS, type Diet } from "@/lib/labels";

const DIET_HELP: Record<Diet, string> = {
  veg: "No meat, fish or eggs",
  egg: "Veg plus eggs",
  nonveg: "Everything",
  vegan: "No animal products",
  jain: "No onion, garlic or root vegetables",
};

const COMMON_EXCLUSIONS = ["onion", "garlic", "mushroom", "peanuts", "paneer", "gluten", "dairy", "brinjal"];

export function OnboardingFlow({ name, suggestedUsername }: { name: string; suggestedUsername: string }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [diet, setDiet] = useState<Diet | null>(null);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [household, setHousehold] = useState(2);
  const [username, setUsername] = useState(suggestedUsername);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const first = name.split(" ")[0];

  function finish() {
    if (!diet) return;
    setError(null);
    startTransition(async () => {
      const res = await completeOnboarding({ diet, exclusions, household_size: household, username });
      if (!res.ok) setError(res.error);
      else router.push("/plan");
    });
  }

  return (
    <div className="glass p-6 sm:p-8">
      <p className="text-sm font-semibold text-ink-orange">Step {step} of 2</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hairline" aria-hidden>
        <div className="h-full rounded-full bg-[image:var(--action)] transition-all" style={{ width: step === 1 ? "50%" : "100%" }} />
      </div>

      {step === 1 ? (
        <section className="mt-6 space-y-6">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight">Hi {first}! What do you eat?</h1>
            <p className="mt-1 text-ink-muted">We&apos;ll suggest dishes and menus that fit.</p>
          </div>
          <fieldset>
            <legend className="sr-only">Diet</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {DIETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={diet === d}
                  onClick={() => setDiet(d)}
                  className={`rounded-xl border p-4 text-left transition ${diet === d ? "border-[var(--ink-orange)] bg-tint-orange" : "border-hairline bg-white hover:border-[var(--ink-orange)]"}`}
                >
                  <span className="block font-semibold">{DIET_LABEL[d]}</span>
                  <span className="block text-sm text-ink-muted">{DIET_HELP[d]}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">Anything you never eat? <span className="font-normal text-ink-muted">(optional)</span></legend>
            <div className="flex flex-wrap gap-2">
              {COMMON_EXCLUSIONS.map((x) => {
                const on = exclusions.includes(x);
                return (
                  <button key={x} type="button" className="chip capitalize" aria-pressed={on} onClick={() => setExclusions(on ? exclusions.filter((e) => e !== x) : [...exclusions, x])}>
                    {x}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <button type="button" className="btn-primary w-full" disabled={!diet} onClick={() => setStep(2)}>
            Continue
          </button>
        </section>
      ) : (
        <section className="mt-6 space-y-6">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight">Almost done</h1>
            <p className="mt-1 text-ink-muted">Two quick things and your week is ready to plan.</p>
          </div>
          <div>
            <p id="hh" className="label">How many people do you usually cook for?</p>
            <div className="flex items-center gap-4" role="group" aria-labelledby="hh">
              <button type="button" className="btn-secondary h-11 w-11 !px-0" aria-label="Fewer people" onClick={() => setHousehold(Math.max(1, household - 1))}>
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-2xl font-bold" aria-live="polite">{household}</span>
              <button type="button" className="btn-secondary h-11 w-11 !px-0" aria-label="More people" onClick={() => setHousehold(Math.min(12, household + 1))}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="username" className="label">Pick a username</label>
            <div className="flex items-center rounded-lg border border-[rgb(43_29_26/0.14)] bg-white focus-within:ring-2 focus-within:ring-ink-orange">
              <span className="pl-3 text-ink-muted">@</span>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={20}
                className="min-h-[44px] w-full rounded-lg bg-transparent px-1 text-base outline-none"
                aria-describedby="username-help"
              />
            </div>
            <p id="username-help" className="mt-1 text-xs text-ink-muted">Shown on menus you share. 3–20 letters, numbers or _.</p>
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button type="button" className="btn-primary flex-1" disabled={pending || username.length < 3} onClick={finish}>
              {pending ? "Saving…" : "Start planning"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
