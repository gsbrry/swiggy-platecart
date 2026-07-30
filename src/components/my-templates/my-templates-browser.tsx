"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Clock,
  Flame,
  GitFork,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Utensils,
  Copy as CopyIcon,
} from "lucide-react";

import type { MineTemplate } from "./mock-mine";

type TabKey = "all" | "created" | "forked";

type Props = {
  templates: MineTemplate[];
};

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "created", label: "Created" },
  { key: "forked", label: "Forked" },
  { key: "all", label: "All" },
];

function fmtForks(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export function MyTemplatesBrowser({ templates }: Props) {
  const [tab, setTab] = useState<TabKey>("all");

  const filtered = useMemo(() => {
    if (tab === "all") return templates;
    return templates.filter((t) => t.origin === tab);
  }, [templates, tab]);

  const counts = useMemo(
    () => ({
      all: templates.length,
      created: templates.filter((t) => t.origin === "created").length,
      forked: templates.filter((t) => t.origin === "forked").length,
    }),
    [templates],
  );

  return (
    <div className="mx-auto max-w-[1160px] px-5 pb-10 pt-[18px]">
      {/* HEADER */}
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-[var(--sw-charcoal)]">
            My Templates
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--sw-muted)]">
            Recipes you&apos;ve created and forked
          </p>
        </div>
        <Link
          href="/templates/new"
          className="flex items-center gap-1.5 rounded-md bg-[var(--sw-orange)] px-3.5 py-2 text-[13px] font-bold text-white transition hover:opacity-90"
        >
          <Plus className="h-[15px] w-[15px]" aria-hidden="true" />
          New template
        </Link>
      </header>

      {/* TAB STRIP */}
      <div
        role="tablist"
        aria-label="Template ownership filter"
        className="mb-5 flex gap-1.5"
      >
        {TABS.map(({ key, label }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-[var(--sw-orange)] bg-[var(--sw-orange-tint)] text-[var(--sw-orange)]"
                  : "border-[var(--sw-border)] bg-white text-[var(--sw-muted)] hover:border-[#c0c0c4] hover:text-[var(--sw-charcoal)]"
              }`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-[1px] text-[10px] font-bold ${
                  active
                    ? "bg-[var(--sw-orange)] text-white"
                    : "bg-[var(--sw-page)] text-[var(--sw-muted)]"
                }`}
              >
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* GRID or EMPTY STATE */}
      {filtered.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <MineCard key={t.id} template={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  const label =
    tab === "created"
      ? "You haven't created any templates yet"
      : tab === "forked"
        ? "You haven't forked any templates yet"
        : "No templates yet";
  const helper =
    tab === "forked"
      ? "Browse the community catalogue and fork a recipe to make it your own."
      : "Start with a blank template or fork one from the browser.";
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--sw-border)] bg-white px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sw-page)] text-[var(--sw-muted)]">
        <Utensils className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="text-[15px] font-bold text-[var(--sw-charcoal)]">{label}</div>
      <p className="mt-1 max-w-[320px] text-[12.5px] text-[var(--sw-muted)]">
        {helper}
      </p>
      <div className="mt-4 flex gap-2">
        <Link
          href="/templates/new"
          className="flex items-center gap-1.5 rounded-md bg-[var(--sw-orange)] px-3.5 py-2 text-[12.5px] font-bold text-white transition hover:opacity-90"
        >
          <Plus className="h-[13px] w-[13px]" aria-hidden="true" />
          New template
        </Link>
        <Link
          href="/templates"
          className="rounded-md border-[1.5px] border-[var(--sw-border)] bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[var(--sw-charcoal)] transition hover:border-[var(--sw-orange)] hover:text-[var(--sw-orange)]"
        >
          Browse catalogue
        </Link>
      </div>
    </div>
  );
}

function MineCard({ template }: { template: MineTemplate }) {
  const visibilityLabel = template.visibility === "public" ? "Public" : "Private";
  const ariaLabel = `${template.dishName}, ${visibilityLabel} template, ${template.kcal} kilocalories, ${template.prepMinutes} minutes prep`;

  return (
    <div className="relative flex items-start gap-3 rounded-lg border border-[var(--sw-border)] bg-white p-3 transition hover:shadow-[0_2px_10px_rgba(40,44,63,0.08)]">
      <Link
        href={`/templates/${template.id}`}
        aria-label={ariaLabel}
        className="absolute inset-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)]"
      />
      {/* THUMB */}
      <div className="relative z-[1] flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-md bg-[var(--sw-page)] text-[var(--sw-border)]">
        <Utensils className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="relative z-[1] min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-bold leading-tight tracking-tight text-[var(--sw-charcoal)]">
              {template.dishName}
            </div>
            {template.origin === "forked" && template.forkedFromCreator && (
              <div className="mt-0.5 text-[10px] text-[var(--sw-muted)]">
                Forked from{" "}
                <span className="font-semibold text-[var(--sw-charcoal)]">
                  {template.forkedFromCreator}
                </span>
              </div>
            )}
          </div>
          <VisibilityPill visibility={template.visibility} />
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
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--sw-muted)]">
          <span className="flex items-center gap-1">
            <GitFork className="h-[13px] w-[13px]" aria-hidden="true" />
            {fmtForks(template.forkCount)}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Flame className="h-[13px] w-[13px]" aria-hidden="true" />
            <span className="font-bold text-[var(--sw-charcoal)]">
              {template.kcal}
            </span>
            kcal
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-[13px] w-[13px]" aria-hidden="true" />
            {template.prepMinutes}m
          </span>
        </div>
      </div>
      {/* KEBAB — sits above the overlay link */}
      <div className="relative z-[2]">
        <KebabMenu templateId={template.id} dishName={template.dishName} />
      </div>
    </div>
  );
}

function VisibilityPill({ visibility }: { visibility: "public" | "private" }) {
  if (visibility === "public") {
    return (
      <span className="flex-shrink-0 rounded-full bg-[rgba(96,178,70,0.12)] px-2 py-[2px] text-[9.5px] font-semibold text-[var(--sw-green)]">
        Public
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 rounded-full bg-[var(--sw-page)] px-2 py-[2px] text-[9.5px] font-semibold text-[var(--sw-muted)]">
      Private
    </span>
  );
}

type MenuAction = { key: "edit" | "duplicate" | "delete"; label: string; Icon: typeof Pencil };
const MENU_ACTIONS: MenuAction[] = [
  { key: "edit", label: "Edit", Icon: Pencil },
  { key: "duplicate", label: "Duplicate", Icon: CopyIcon },
  { key: "delete", label: "Delete", Icon: Trash2 },
];

function KebabMenu({
  templateId,
  dishName,
}: {
  templateId: string;
  dishName: string;
}) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(0);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const close = useCallback(() => {
    setOpen(false);
    btnRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        btnRef.current &&
        !btnRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIdx((i) => (i + 1) % MENU_ACTIONS.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIdx((i) => (i - 1 + MENU_ACTIONS.length) % MENU_ACTIONS.length);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) itemRefs.current[focusIdx]?.focus();
  }, [open, focusIdx]);

  const runAction = (key: MenuAction["key"]) => {
    console.log(`[my-templates] ${key} template=${templateId} name="${dishName}"`);
    close();
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Template actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
          setFocusIdx(0);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--sw-muted)] transition hover:bg-[var(--sw-page)] hover:text-[var(--sw-charcoal)]"
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Actions for ${dishName}`}
          className="absolute right-0 top-8 z-30 w-40 overflow-hidden rounded-md border border-[var(--sw-border)] bg-white py-1 shadow-[0_6px_20px_rgba(40,44,63,0.15)]"
        >
          {MENU_ACTIONS.map(({ key, label, Icon }, i) => {
            const danger = key === "delete";
            return (
              <button
                key={key}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  runAction(key);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] transition ${
                  danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-[var(--sw-charcoal)] hover:bg-[var(--sw-page)]"
                }`}
              >
                <Icon className="h-[14px] w-[14px]" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
