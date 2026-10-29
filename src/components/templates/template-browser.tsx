"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Clock,
  Coffee,
  Flame,
  GitFork,
  Grid3x3,
  Leaf,
  List,
  Search,
  Soup,
  SlidersHorizontal,
  TrendingUp,
  Utensils,
  X,
  Zap,
} from "lucide-react";

import type {
  BrowserTemplate,
  TemplateFilterKey,
  TemplateLane,
  TemplateMealType,
} from "./types";

type Props = {
  templates: BrowserTemplate[];
};

const FILTERS: Array<{
  key: TemplateFilterKey;
  label: string;
  Icon: typeof BookOpen;
}> = [
  { key: "all", label: "All", Icon: BookOpen },
  { key: "veg", label: "Vegetarian", Icon: Leaf },
  { key: "highprot", label: "High Protein", Icon: Zap },
  { key: "quick", label: "Under 15 min", Icon: Clock },
  { key: "light", label: "Light <300 kcal", Icon: Flame },
  { key: "loss", label: "Weight Loss", Icon: TrendingUp },
];

const LANES: Array<{
  id: TemplateLane;
  title: string;
  sub: string;
}> = [
  {
    id: "foryou",
    title: "For You",
    sub: "Based on your Weight Loss · Vegetarian goal",
  },
  {
    id: "popular",
    title: "Most Forked This Week",
    sub: "Community favourites",
  },
  {
    id: "quick",
    title: "Ready in Under 15 min",
    sub: "When you have no time",
  },
  {
    id: "protein",
    title: "High Protein Picks",
    sub: "20g+ protein per serving",
  },
];

const FILTER_COUNTS: Record<TemplateFilterKey, string> = {
  all: "340",
  veg: "287",
  highprot: "96",
  quick: "124",
  light: "102",
  loss: "156",
};

function fmtForks(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function ThumbIcon({
  mealType,
  className,
}: {
  mealType: TemplateMealType;
  className?: string;
}) {
  const Icon =
    mealType === "breakfast" ? Coffee : mealType === "lunch" ? Soup : Utensils;
  return <Icon className={className} aria-hidden="true" />;
}

function applyFilter(
  templates: BrowserTemplate[],
  filter: TemplateFilterKey,
  search: string,
): BrowserTemplate[] {
  const q = search.trim().toLowerCase();
  return templates.filter((t) => {
    if (filter !== "all" && !t.filters.includes(filter)) return false;
    if (!q) return true;
    return (
      t.dishName.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });
}

export function TemplateBrowser({ templates }: Props) {
  const [filter, setFilter] = useState<TemplateFilterKey>("all");
  const [view, setView] = useState<"lane" | "grid">("lane");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => applyFilter(templates, filter, search),
    [templates, filter, search],
  );

  const searching = search.trim().length > 0;
  // Search results always render as grid — lane layout doesn't fit filtered results.
  const effectiveView = searching ? "grid" : view;

  const resultsLabel = searching
    ? `${filtered.length} result${filtered.length === 1 ? "" : "s"} for "${search.trim()}"`
    : `${FILTER_COUNTS[filter]} templates available · Vegetarian · Weight Loss goal`;

  return (
    <div className="mx-auto max-w-[1160px] px-5 pb-10 pt-[18px]">
      {/* SEARCH */}
      <div className="relative mb-3.5">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[var(--sw-muted)]"
          aria-hidden="true"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search 340 recipes — try 'dal', 'protein', 'quick breakfast'…"
          aria-label="Search recipes"
          className="w-full rounded-lg border-[1.5px] border-[var(--sw-border)] bg-white/70 backdrop-blur-md py-2.5 pl-[42px] pr-11 text-sm text-[var(--sw-charcoal)] outline-none transition placeholder:text-[var(--sw-muted)] focus:border-[var(--sw-orange)] focus:shadow-[0_0_0_3px_var(--sw-orange-tint)]"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--sw-muted)] hover:text-[var(--sw-charcoal)]"
          >
            <X className="h-[15px] w-[15px]" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* FILTER ROW */}
      <div className="mb-5 flex items-center gap-2">
        <div
          role="group"
          aria-label="Diet and goal filters"
          className="flex flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {FILTERS.map(({ key, label, Icon }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                role="button"
                aria-pressed={active}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-[var(--sw-orange)] bg-[var(--sw-orange-tint)] text-[var(--sw-orange)]"
                    : "border-[var(--sw-border)] bg-white/70 backdrop-blur-md text-[var(--sw-muted)] hover:border-[#c0c0c4] hover:text-[var(--sw-charcoal)]"
                }`}
              >
                <Icon className="h-[13px] w-[13px]" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => console.log("[template-browser] sort clicked")}
          className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border-[1.5px] border-[var(--sw-border)] bg-white/70 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-[var(--sw-muted)] transition hover:border-[#c0c0c4] hover:text-[var(--sw-charcoal)]"
        >
          <SlidersHorizontal className="h-[13px] w-[13px]" aria-hidden="true" />
          Sort
        </button>

        <div role="tablist" aria-label="View mode" className="flex flex-shrink-0 gap-1">
          <button
            type="button"
            role="tab"
            aria-selected={effectiveView === "lane"}
            aria-label="Lane view"
            disabled={searching}
            onClick={() => setView("lane")}
            className={`flex h-8 w-8 items-center justify-center rounded-md border-[1.5px] transition disabled:cursor-not-allowed disabled:opacity-50 ${
              effectiveView === "lane"
                ? "border-[var(--sw-orange)] bg-[var(--sw-orange-tint)] text-[var(--sw-orange)]"
                : "border-[var(--sw-border)] bg-white/70 backdrop-blur-md text-[var(--sw-muted)] hover:border-[#c0c0c4] hover:text-[var(--sw-charcoal)]"
            }`}
          >
            <List className="h-[15px] w-[15px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={effectiveView === "grid"}
            aria-label="Grid view"
            onClick={() => setView("grid")}
            className={`flex h-8 w-8 items-center justify-center rounded-md border-[1.5px] transition ${
              effectiveView === "grid"
                ? "border-[var(--sw-orange)] bg-[var(--sw-orange-tint)] text-[var(--sw-orange)]"
                : "border-[var(--sw-border)] bg-white/70 backdrop-blur-md text-[var(--sw-muted)] hover:border-[#c0c0c4] hover:text-[var(--sw-charcoal)]"
            }`}
          >
            <Grid3x3 className="h-[15px] w-[15px]" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* RESULTS CONTEXT */}
      <div className="mb-4 flex items-center justify-between text-xs text-[var(--sw-muted)]">
        <span>
          <strong className="text-[var(--sw-charcoal)]">{resultsLabel.split(" ")[0]}</strong>{" "}
          {resultsLabel.split(" ").slice(1).join(" ")}
        </span>
        {searching && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="cursor-pointer font-semibold text-[var(--sw-orange)]"
          >
            Clear search
          </button>
        )}
      </div>

      {effectiveView === "lane" ? (
        <LaneView templates={filtered} />
      ) : (
        <GridView templates={filtered} />
      )}
    </div>
  );
}

function LaneView({ templates }: { templates: BrowserTemplate[] }) {
  return (
    <div>
      {LANES.map((lane) => {
        const laneTemplates = templates
          .filter((t) => t.lane.includes(lane.id))
          .slice(0, 8);
        if (laneTemplates.length === 0) return null;
        return (
          <section key={lane.id} className="mb-7">
            <header className="mb-3 flex items-baseline justify-between">
              <div>
                <span className="text-[16px] font-bold tracking-tight text-[var(--sw-charcoal)]">
                  {lane.title}
                </span>
                <span className="ml-2 text-[11px] font-normal text-[var(--sw-muted)]">
                  {lane.sub}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  console.log(`[template-browser] see all lane=${lane.id}`)
                }
                className="flex items-center gap-1 text-xs font-semibold text-[var(--sw-orange)]"
              >
                See all
                <ChevronRight className="h-[13px] w-[13px]" aria-hidden="true" />
              </button>
            </header>
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {laneTemplates.map((t) => (
                <LaneCard key={`${lane.id}-${t.id}`} template={t} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function GridView({ templates }: { templates: BrowserTemplate[] }) {
  if (templates.length === 0) {
    return (
      <div className="rounded-lg glass p-10 text-center text-sm text-[var(--sw-muted)]">
        No templates match your filters.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <GridCard key={t.id} template={t} />
      ))}
    </div>
  );
}

function LaneCard({ template }: { template: BrowserTemplate }) {
  return (
    <Link
      href={`/templates/${template.id}`}
      aria-label={`${template.dishName}, ${template.kcal} kilocalories, ${template.prepMinutes} minutes prep`}
      className="group relative flex w-[178px] flex-shrink-0 flex-col rounded-lg glass transition hover:-translate-y-px hover:shadow-[0_2px_12px_rgba(40,44,63,0.1)]"
    >
      <div className="relative flex h-[88px] items-center justify-center overflow-hidden rounded-t-lg bg-[var(--sw-page)]">
        <ThumbIcon
          mealType={template.mealType}
          className="h-7 w-7 text-[var(--sw-border)]"
        />
        <span
          aria-hidden="true"
          className="absolute left-2 top-2 h-2 w-2 rounded-full bg-[var(--sw-green)]"
        />
        <span className="absolute right-2 top-[7px] flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--sw-muted)]">
          <GitFork className="h-[13px] w-[13px]" aria-hidden="true" />
          {fmtForks(template.forkCount)}
        </span>
      </div>
      <div className="px-2.5 pb-2 pt-2.5">
        <div className="mb-1.5 min-h-[34px] text-[12.5px] font-bold leading-[1.35] tracking-tight text-[var(--sw-charcoal)]">
          {template.dishName}
        </div>
        <div className="mb-2 flex flex-wrap gap-1">
          {template.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-1.5 py-[2px] text-[9.5px] font-medium ${
                tag === "Veg"
                  ? "bg-[rgba(96,178,70,0.1)] text-[var(--sw-green)]"
                  : "bg-[var(--sw-page)] text-[var(--sw-muted)]"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mb-2 flex items-center gap-1.5 text-[10.5px] text-[var(--sw-muted)]">
          <Flame className="h-[13px] w-[13px]" aria-hidden="true" />
          <span className="font-bold text-[var(--sw-charcoal)]">{template.kcal}</span>
          <span>kcal</span>
          <span className="text-[var(--sw-border)]">·</span>
          <Clock className="h-[13px] w-[13px]" aria-hidden="true" />
          <span>{template.prepMinutes}m</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(
              `[template-browser] add to plan template=${template.id}`,
            );
          }}
          className="flex w-full items-center justify-center gap-1 rounded-md bg-appetite py-1.5 text-[11px] font-bold text-white transition hover:opacity-90"
        >
          + Add to plan
        </button>
      </div>
    </Link>
  );
}

function GridCard({ template }: { template: BrowserTemplate }) {
  return (
    <Link
      href={`/templates/${template.id}`}
      aria-label={`${template.dishName}, ${template.kcal} kilocalories, ${template.prepMinutes} minutes prep`}
      className="flex items-start gap-3 rounded-lg glass p-3 transition hover:shadow-[0_2px_10px_rgba(40,44,63,0.08)]"
    >
      <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-md bg-[var(--sw-page)] text-[var(--sw-border)]">
        <ThumbIcon mealType={template.mealType} className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-[12.5px] font-bold leading-tight tracking-tight text-[var(--sw-charcoal)]">
          {template.dishName}
        </div>
        <div className="mb-1.5 flex flex-wrap gap-1">
          {template.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-1.5 py-[1px] text-[9px] ${
                tag === "Veg"
                  ? "bg-[rgba(96,178,70,0.1)] text-[var(--sw-green)]"
                  : "bg-[var(--sw-page)] text-[var(--sw-muted)]"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mb-2 flex items-center gap-1.5 text-[10px] text-[var(--sw-muted)]">
          <span className="font-bold text-[var(--sw-charcoal)]">
            {template.kcal}kcal
          </span>
          <span>·</span>
          <span>{template.prepMinutes}m</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <GitFork className="h-[13px] w-[13px]" aria-hidden="true" />
            {fmtForks(template.forkCount)}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(
              `[template-browser] add to plan template=${template.id}`,
            );
          }}
          className="w-full rounded-md border-[1.5px] border-[var(--sw-border)] bg-[var(--sw-page)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--sw-charcoal)] transition hover:border-[var(--sw-orange)] hover:bg-[var(--sw-orange-tint)] hover:text-[var(--sw-orange)]"
        >
          + Add to plan
        </button>
      </div>
    </Link>
  );
}
