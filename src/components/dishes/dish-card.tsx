import Link from "next/link";
import { Clock, GitFork } from "lucide-react";

import { DietDot } from "@/components/ui/diet-dot";
import type { Diet } from "@/lib/labels";

export type DishCardData = {
  id: string;
  name: string;
  diet: Diet;
  tags: string[];
  cook_minutes: number | null;
  fork_count: number;
  owner_id: string | null;
  is_public: boolean;
};

/** The whole card is the link: no buttons inside a grid of cards (UX review §4.4). */
export function DishCard({ dish, mine }: { dish: DishCardData; mine: boolean }) {
  return (
    <Link
      href={`/dishes/${dish.id}`}
      className="surface group flex flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-orange"
    >
      <div className="flex items-start gap-2">
        <DietDot diet={dish.diet} className="mt-1" />
        <h3 className="flex-1 text-[17px] font-semibold leading-snug group-hover:text-ink-orange">{dish.name}</h3>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {dish.tags.slice(0, 3).map((t) => (
          <span key={t} className="rounded-full bg-fill-subtle px-2 py-0.5 text-xs text-ink-muted">
            {t}
          </span>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-3 pt-1 text-xs text-ink-muted">
        {dish.cook_minutes && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {dish.cook_minutes} min
          </span>
        )}
        {dish.fork_count > 0 && (
          <span className="inline-flex items-center gap-1">
            <GitFork className="h-3.5 w-3.5" /> {dish.fork_count}
          </span>
        )}
        {mine && <span className="ml-auto font-semibold text-ink-orange">{dish.is_public ? "Mine · public" : "Mine"}</span>}
        {!dish.owner_id && <span className="ml-auto">Planetto Kitchen</span>}
      </div>
    </Link>
  );
}
