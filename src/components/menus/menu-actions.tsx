"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CalendarPlus, Check, Copy, MessageCircle, Star } from "lucide-react";

import { Sheet } from "@/components/ui/sheet";
import { getMenu, rateMenu, setMenuVisibility } from "@/lib/actions/menus";
import { addDays, formatDay } from "@/lib/dates";
import { VISIBILITY_LABEL, type Period, type Visibility } from "@/lib/labels";

export function GetMenuButton({
  slug,
  period,
  today,
  nextMonday,
  signedIn,
}: {
  slug: string;
  period: Period;
  today: string;
  nextMonday: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(period === "day" ? today : nextMonday);
  const [mode, setMode] = useState<"fill_empty" | "overwrite">("fill_empty");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Link href={`/sign-up?next=/m/${slug}`} className="btn-primary">
        <CalendarPlus className="h-4 w-4" /> Use this menu
      </Link>
    );
  }

  const options = Array.from({ length: period === "day" ? 14 : 5 }, (_, i) => (period === "day" ? addDays(today, i) : addDays(nextMonday, (i - 1) * 7))).filter(
    (d) => d >= today || period !== "day",
  );

  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        <CalendarPlus className="h-4 w-4" /> Use this menu
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Add this menu to my plan">
        <div className="space-y-5">
          <div>
            <label htmlFor="start" className="label">{period === "day" ? "Which day?" : "Starting"}</label>
            <select id="start" className="input" value={start} onChange={(e) => setStart(e.target.value)}>
              {options.map((d) => (
                <option key={d} value={d}>
                  {formatDay(d, { weekday: "long", day: "numeric", month: "short" })}
                  {d === today ? " (today)" : ""}
                </option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className="label">If a meal is already planned</legend>
            <div className="space-y-2">
              {(
                [
                  ["fill_empty", "Keep my meals", "Only fill the empty slots."],
                  ["overwrite", "Replace them", "Use this menu for every meal."],
                ] as const
              ).map(([v, title, help]) => (
                <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${mode === v ? "border-[var(--ink-orange)] bg-tint-orange" : "border-hairline bg-white"}`}>
                  <input type="radio" name="mode" checked={mode === v} onChange={() => setMode(v)} className="mt-1 h-4 w-4 accent-[var(--ink-orange)]" />
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="block text-sm text-ink-muted">{help}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button
            type="button"
            className="btn-primary w-full"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const res = await getMenu({ slug, start, mode });
                if (res.ok) router.push(`/plan?w=${start}&added=${res.data}`);
                else setError(res.error);
              })
            }
          >
            {pending ? "Adding…" : "Add to my plan"}
          </button>
        </div>
      </Sheet>
    </>
  );
}

export function ShareButtons({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false);
  // Origin is only known in the browser; resolve it after hydration so server and client HTML match.
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/m/${slug}`;
  return (
    <>
      <button
        type="button"
        className="btn-secondary"
        onClick={async () => {
          try {
            if (navigator.share) await navigator.share({ title, url });
            else {
              await navigator.clipboard.writeText(url);
              setCopied(true);
            }
          } catch {
            /* user cancelled the share sheet */
          }
        }}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Link copied" : "Share"}
      </button>
      <a className="btn-secondary" href={`https://wa.me/?text=${encodeURIComponent(`${title} — a meal plan on Planetto: ${url}`)}`} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </a>
    </>
  );
}

export function RateForm({ menuId, slug, initialStars, initialReview }: { menuId: string; slug: string; initialStars: number; initialReview: string }) {
  const router = useRouter();
  const [stars, setStars] = useState(initialStars);
  const [review, setReview] = useState(initialReview);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="surface-solid space-y-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await rateMenu({ menuId, slug, stars, review });
          setMsg(res.ok ? { ok: true, text: "Thanks for rating!" } : { ok: false, text: res.error });
          if (res.ok) router.refresh();
        });
      }}
    >
      <p className="font-semibold">{initialStars ? "Your rating" : "How was this menu?"}</p>
      <div role="radiogroup" aria-label="Stars" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={stars === i}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            onClick={() => setStars(i)}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-fill-subtle"
          >
            <Star className={`h-7 w-7 ${i <= stars ? "fill-[#E0A100] text-[#E0A100]" : "text-[rgb(43_29_26/0.25)]"}`} />
          </button>
        ))}
      </div>
      <label htmlFor="review" className="sr-only">Review</label>
      <textarea id="review" rows={3} maxLength={500} value={review} onChange={(e) => setReview(e.target.value)} className="input py-2" placeholder="What worked? What would you change? (optional)" />
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      <button className="btn-primary" disabled={pending || stars === 0}>{pending ? "Saving…" : initialStars ? "Update rating" : "Submit rating"}</button>
    </form>
  );
}

export function VisibilityControl({ menuId, slug, value }: { menuId: string; slug: string; value: Visibility }) {
  const router = useRouter();
  const [v, setV] = useState(value);
  const [pending, startTransition] = useTransition();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-semibold">Who can see it:</span>
      <select
        className="input w-auto min-h-[40px] py-1"
        value={v}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as Visibility;
          setV(next);
          startTransition(async () => {
            const res = await setMenuVisibility({ menuId, slug, visibility: next });
            if (!res.ok) setV(value);
            router.refresh();
          });
        }}
      >
        {(["private", "link", "public"] as const).map((x) => (
          <option key={x} value={x}>{VISIBILITY_LABEL[x]}</option>
        ))}
      </select>
    </label>
  );
}
