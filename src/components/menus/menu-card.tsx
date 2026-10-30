import Link from "next/link";
import { Users } from "lucide-react";

import { DietDot } from "@/components/ui/diet-dot";
import { Stars } from "@/components/ui/stars";
import { DIET_LABEL, PERIOD_LABEL, type Diet, type Period } from "@/lib/labels";

export type MenuCardData = {
  slug: string;
  title: string;
  period: Period;
  diet: Diet;
  tags: string[];
  rating_avg: number;
  rating_count: number;
  get_count: number;
  author: string;
  preview: string[];
};

export function MenuCard({ menu, badge }: { menu: MenuCardData; badge?: string }) {
  return (
    <Link
      href={`/m/${menu.slug}`}
      className="surface group flex h-full flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange"
    >
      <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <DietDot diet={menu.diet} /> {DIET_LABEL[menu.diet]}
        </span>
        <span className="rounded-full bg-tint-orange px-2 py-0.5 text-ink-orange">{PERIOD_LABEL[menu.period]}</span>
      </div>
      <div>
        <h3 className="text-lg font-semibold leading-snug group-hover:text-ink-orange">{menu.title}</h3>
        <p className="text-sm text-ink-muted">
          by {menu.author}
          {badge && <span className="ml-2 rounded-full bg-fill-subtle px-2 py-0.5 text-xs font-medium">{badge}</span>}
        </p>
      </div>
      {menu.preview.length > 0 && (
        <ul className="space-y-0.5 text-sm text-ink-muted">
          {menu.preview.slice(0, 3).map((p, i) => (
            <li key={i} className="truncate">· {p}</li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-between pt-1">
        <Stars value={Number(menu.rating_avg)} count={menu.rating_count} />
        <span className="inline-flex items-center gap-1 text-sm text-ink-muted">
          <Users className="h-4 w-4" aria-hidden /> {menu.get_count} <span className="sr-only">people used this</span>
        </span>
      </div>
    </Link>
  );
}
