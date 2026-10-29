"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarPlus, Copy, Flag } from "lucide-react";

import { Sheet } from "@/components/ui/sheet";
import { addDishToPlan, forkDish, reportContent } from "@/lib/actions/dishes";
import { addDays, formatDay } from "@/lib/dates";
import { MEAL_LABEL, MEALS, type Meal } from "@/lib/labels";

export function AddToPlanButton({ dishId, today, defaultMeal, signedIn }: { dishId: string; today: string; defaultMeal: Meal; signedIn: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today);
  const [meal, setMeal] = useState<Meal>(defaultMeal);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  if (!signedIn) {
    return (
      <a href={`/sign-in?next=/dishes/${dishId}`} className="btn-primary">
        <CalendarPlus className="h-4 w-4" /> Add to my plan
      </a>
    );
  }

  return (
    <>
      <button type="button" className="btn-primary" onClick={() => { setMsg(null); setOpen(true); }}>
        <CalendarPlus className="h-4 w-4" /> Add to my plan
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Add to my plan">
        <div className="space-y-4">
          <div>
            <label htmlFor="day" className="label">Day</label>
            <select id="day" className="input" value={date} onChange={(e) => setDate(e.target.value)}>
              {days.map((d, i) => (
                <option key={d} value={d}>
                  {i === 0 ? "Today · " : i === 1 ? "Tomorrow · " : ""}
                  {formatDay(d, { weekday: "long", day: "numeric", month: "short" })}
                </option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className="label">Meal</legend>
            <div className="flex gap-2">
              {MEALS.map((m) => (
                <button key={m} type="button" className="chip" aria-pressed={meal === m} onClick={() => setMeal(m)}>
                  {MEAL_LABEL[m]}
                </button>
              ))}
            </div>
          </fieldset>
          {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await addDishToPlan({ dishId, date, meal });
                  setMsg(res.ok ? { ok: true, text: "Added. It replaced anything already in that slot." } : { ok: false, text: res.error });
                })
              }
            >
              {pending ? "Adding…" : "Add"}
            </button>
            {msg?.ok && (
              <button type="button" className="btn-secondary" onClick={() => router.push(`/plan?w=${date}`)}>
                View plan
              </button>
            )}
          </div>
        </div>
      </Sheet>
    </>
  );
}

export function ForkButton({ dishId, signedIn }: { dishId: string; signedIn: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (!signedIn) return null;
  return (
    <>
      <button
        type="button"
        className="btn-secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await forkDish(dishId);
            if (res.ok) router.push(`/dishes/${res.data}/edit`);
            else setError(res.error);
          })
        }
      >
        <Copy className="h-4 w-4" /> {pending ? "Copying…" : "Copy to my dishes"}
      </button>
      {error && <p role="alert" className="w-full text-sm text-danger">{error}</p>}
    </>
  );
}

export function ReportButton({ type, id, signedIn }: { type: "menu" | "rating" | "dish"; id: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  if (!signedIn) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-ink-muted hover:text-danger">
        <Flag className="h-4 w-4" /> Report
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Report this">
        {done ? (
          <p className="text-ink-muted">Thanks. Our team will review it within 48 hours.</p>
        ) : (
          <form
            className="space-y-4"
            action={(form) =>
              startTransition(async () => {
                const res = await reportContent({ type, id, reason: String(form.get("reason") ?? "") });
                if (res.ok) setDone(true);
                else setError(res.error);
              })
            }
          >
            <div>
              <label htmlFor="reason" className="label">What&apos;s wrong?</label>
              <textarea id="reason" name="reason" rows={3} required minLength={3} maxLength={500} className="input py-2" placeholder="Spam, offensive, unsafe advice, copied without credit…" />
            </div>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <button className="btn-primary w-full" disabled={pending}>{pending ? "Sending…" : "Send report"}</button>
          </form>
        )}
      </Sheet>
    </>
  );
}
