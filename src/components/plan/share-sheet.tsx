"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, Copy, Link2, MessageCircle } from "lucide-react";

import { Sheet } from "@/components/ui/sheet";
import { createMenuFromPlan } from "@/lib/actions/plan";
import { formatDay, weekLabel } from "@/lib/dates";
import { DIET_LABEL, DIETS, VISIBILITY_LABEL, type Diet, type Period, type Visibility } from "@/lib/labels";

const VISIBILITY_HELP: Record<Visibility, string> = {
  private: "Saved to your menus. Nobody else can see it.",
  link: "Anyone you send the link to can view and copy it.",
  public: "Listed in the Market so anyone can find, copy and rate it.",
};

export function ShareSheet({
  open,
  onClose,
  monday,
  selectedDay,
  diet,
  defaultVisibility,
}: {
  open: boolean;
  onClose: () => void;
  monday: string;
  selectedDay: string;
  diet: Diet;
  defaultVisibility: Visibility;
}) {
  const [pending, startTransition] = useTransition();
  const [period, setPeriod] = useState<Exclude<Period, "month">>("week");
  const [visibility, setVisibility] = useState<Visibility>(defaultVisibility);
  const [menuDiet, setMenuDiet] = useState<Diet>(diet);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const start = period === "week" ? monday : selectedDay;
  const defaultTitle =
    period === "week" ? `My week · ${weekLabel(monday)}` : `My day · ${formatDay(selectedDay, { weekday: "long", day: "numeric", month: "short" })}`;

  function close() {
    setSlug(null);
    setError(null);
    setCopied(false);
    onClose();
  }

  function submit(form: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createMenuFromPlan({
        start,
        period,
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
        visibility,
        diet: menuDiet,
        tags: String(form.get("tags") ?? "").split(","),
      });
      if (res.ok) setSlug(res.data);
      else setError(res.error);
    });
  }

  const url = slug ? `${window.location.origin}/m/${slug}` : "";
  const shareText = `Here's my meal plan on Planetto: ${url}`;

  return (
    <Sheet open={open} onClose={close} title={slug ? "Your menu is ready" : "Share or publish"}>
      {slug ? (
        <div className="space-y-4">
          <p className="text-ink-muted">{VISIBILITY_HELP[visibility]}</p>
          <div className="flex items-center gap-2 rounded-lg border border-hairline bg-white p-2 pl-3">
            <Link2 className="h-4 w-4 shrink-0 text-ink-muted" />
            <span className="min-w-0 flex-1 truncate text-sm">{url}</span>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={async () => {
                await navigator.clipboard.writeText(url).catch(() => {});
                setCopied(true);
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <a className="btn-primary" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> Send on WhatsApp
            </a>
            <Link href={`/m/${slug}`} className="btn-secondary">
              Open menu page
            </Link>
          </div>
        </div>
      ) : (
        <form action={submit} className="space-y-5">
          <fieldset>
            <legend className="label">What to share</legend>
            <div className="flex gap-2">
              <button type="button" className="chip" aria-pressed={period === "week"} onClick={() => setPeriod("week")}>
                Whole week
              </button>
              <button type="button" className="chip" aria-pressed={period === "day"} onClick={() => setPeriod("day")}>
                {formatDay(selectedDay, { weekday: "long" })} only
              </button>
            </div>
          </fieldset>
          <div>
            <label htmlFor="title" className="label">Title</label>
            <input key={defaultTitle} id="title" name="title" defaultValue={defaultTitle} required minLength={3} maxLength={80} className="input" />
          </div>
          <div>
            <label htmlFor="description" className="label">
              Description <span className="font-normal text-ink-muted">(optional)</span>
            </label>
            <textarea id="description" name="description" rows={2} maxLength={600} className="input py-2" placeholder="Who is this for? Any tips?" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="diet" className="label">Diet</label>
              <select id="diet" value={menuDiet} onChange={(e) => setMenuDiet(e.target.value as Diet)} className="input">
                {DIETS.map((d) => (
                  <option key={d} value={d}>{DIET_LABEL[d]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tags" className="label">
                Tags <span className="font-normal text-ink-muted">(up to 3)</span>
              </label>
              <input id="tags" name="tags" className="input" placeholder="quick, high-protein" maxLength={80} />
            </div>
          </div>
          <fieldset>
            <legend className="label">Who can see it</legend>
            <div className="space-y-2">
              {(["link", "public", "private"] as const).map((v) => (
                <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${visibility === v ? "border-[var(--ink-orange)] bg-tint-orange" : "border-hairline bg-white"}`}>
                  <input type="radio" name="visibility" value={v} checked={visibility === v} onChange={() => setVisibility(v)} className="mt-1 h-4 w-4 accent-[var(--ink-orange)]" />
                  <span>
                    <span className="block font-semibold">{VISIBILITY_LABEL[v]}</span>
                    <span className="block text-sm text-ink-muted">{VISIBILITY_HELP[v]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {visibility === "public" && (
            <p className="text-sm text-ink-muted">
              Public menus must follow the <Link href="/terms" className="text-ink-orange underline">community rules</Link>. Menus are free for now.
            </p>
          )}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? "Creating…" : visibility === "public" ? "Publish to Market" : "Create share link"}
          </button>
        </form>
      )}
    </Sheet>
  );
}
