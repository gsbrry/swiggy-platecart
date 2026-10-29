"use client";

import { useState } from "react";

type MealType = "breakfast" | "lunch" | "dinner";

type Slot = {
  id: string;
  mealType: MealType;
  isEatout: boolean;
  templateId: string | null;
  template: { id: string; dishName: string; tags: string[] } | null;
};

type Props = {
  slots: Slot[];
  weekStartIso: string;
};

const ORDER: MealType[] = ["breakfast", "lunch", "dinner"];
const META: Record<MealType, { icon: string; label: string }> = {
  breakfast: { icon: "🌅", label: "BREAKFAST" },
  lunch: { icon: "☀️", label: "LUNCH" },
  dinner: { icon: "🌙", label: "DINNER" },
};

// TODO(dashboard): wire from API when ready — kcal / prep-time not in schema yet.
const PLACEHOLDER_TAGS = ["Veg", "~300 kcal", "15 min"];

/** Three-up meal cards for today's slots. Interactive because "Add to Instamart" hits an API. */
export function MealCards({ slots, weekStartIso }: Props) {
  // Slot lookup by meal type.
  const bySlot: Partial<Record<MealType, Slot>> = {};
  for (const s of slots) bySlot[s.mealType] = s;

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
      {ORDER.map((meal) => {
        const slot = bySlot[meal];
        return (
          <MealCard
            key={meal}
            meal={meal}
            slot={slot}
            weekStartIso={weekStartIso}
          />
        );
      })}
    </div>
  );
}

function MealCard({
  meal,
  slot,
  weekStartIso,
}: {
  meal: MealType;
  slot: Slot | undefined;
  weekStartIso: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const meta = META[meal];

  const handleAdd = async () => {
    if (!slot?.templateId) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/cart/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_ids: [slot.templateId], date: weekStartIso }),
      });
      const data = (await res.json()) as { items?: unknown[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "cart build failed");
      // eslint-disable-next-line no-console
      console.info("cart:build", { meal, items: data.items?.length ?? 0 });
      setStatus("done");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("cart:build failed", err);
      setStatus("error");
    }
  };

  // Empty slot — show "Add a meal" placeholder per UI rules.
  if (!slot || !slot.template) {
    return (
      <div className="relative rounded-lg border border-dashed border-[var(--sw-border)] bg-white/70 backdrop-blur-md p-4">
        <div className="mb-2.5 inline-flex items-center gap-1 rounded-full bg-[var(--sw-page)] px-2 py-0.5 text-[9px] font-bold tracking-wider text-[var(--sw-muted)]">
          <span>{meta.icon}</span>
          {meta.label}
        </div>
        <div className="mb-1 text-[15px] font-bold tracking-tight text-[var(--sw-muted)]">
          + Add a meal
        </div>
        <a
          href="/meal-plan"
          className="mt-3 block w-full rounded-lg border-[1.5px] border-[var(--sw-orange)] bg-[var(--sw-page)] py-2 text-center text-xs font-bold text-[var(--sw-orange)]"
        >
          Plan this slot
        </a>
      </div>
    );
  }

  const isEatout = slot.isEatout;

  return (
    <div className="relative rounded-lg glass p-4">
      <div className="mb-2.5 inline-flex items-center gap-1 rounded-full bg-[var(--sw-page)] px-2 py-0.5 text-[9px] font-bold tracking-wider text-[var(--sw-muted)]">
        <span>{meta.icon}</span>
        {meta.label}
      </div>
      <div
        className={`mb-0.5 text-[15px] font-bold tracking-tight ${
          isEatout ? "text-[var(--sw-muted)]" : "text-[var(--sw-charcoal)]"
        }`}
      >
        {slot.template.dishName}
      </div>
      <div className="mb-3 text-[11px] text-[var(--sw-muted)]">
        {isEatout ? "Eat-out slot" : "From template"}
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(slot.template.tags.length > 0 ? slot.template.tags : PLACEHOLDER_TAGS).map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              tag.toLowerCase() === "veg"
                ? "bg-[#EDFAE3] text-[var(--sw-green)]"
                : "bg-[var(--sw-page)] text-[var(--sw-muted)]"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={status === "loading" || !slot.templateId}
        className="w-full rounded-lg bg-appetite py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
      >
        {status === "loading"
          ? "Building cart…"
          : status === "done"
            ? "✓ Added to Instamart"
            : status === "error"
              ? "Retry"
              : "Add ingredients to Instamart"}
      </button>
    </div>
  );
}
