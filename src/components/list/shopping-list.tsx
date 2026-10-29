"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

import { formatQty, type ListItem } from "@/lib/shopping";

/** Check-offs are a per-device convenience, so they live in localStorage (safe to lose). */
function loadChecked(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

export function ShoppingList({ items, storageKey, title }: { items: ListItem[]; storageKey: string; title: string }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  useEffect(() => setChecked(new Set(loadChecked(storageKey))), [storageKey]);

  function toggle(key: string) {
    const next = new Set(checked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setChecked(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify([...next]));
    } catch {
      /* storage unavailable: still works for this visit */
    }
  }

  const remaining = items.filter((i) => !checked.has(i.key));
  const text = [title, ...remaining.map((i) => `• ${i.name}${i.quantity != null ? ` — ${formatQty(i.quantity, i.unit)}` : ""}`)].join("\n");
  const ordered = [...remaining, ...items.filter((i) => checked.has(i.key))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={async () => {
            await navigator.clipboard.writeText(text).catch(() => {});
            setCopied(true);
          }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy list"}
        </button>
        <a className="btn-secondary btn-sm" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-4 w-4" /> Send on WhatsApp
        </a>
        <span className="ml-auto self-center text-sm text-ink-muted">{remaining.length} of {items.length} left</span>
      </div>
      <ul className="surface-solid divide-y divide-hairline">
        {ordered.map((i) => {
          const done = checked.has(i.key);
          return (
            <li key={i.key}>
              <label className="flex min-h-[56px] cursor-pointer items-center gap-3 px-4 py-2.5">
                <input type="checkbox" checked={done} onChange={() => toggle(i.key)} className="h-5 w-5 shrink-0 accent-[var(--ink-orange)]" />
                <span className={`min-w-0 flex-1 ${done ? "text-ink-faint line-through" : ""}`}>
                  <span className="block font-medium capitalize">{i.name}</span>
                  <span className="block truncate text-xs text-ink-muted">for {i.dishes.slice(0, 3).join(", ")}{i.dishes.length > 3 ? ` +${i.dishes.length - 3}` : ""}</span>
                </span>
                <span className={`shrink-0 text-sm ${done ? "text-ink-faint" : "font-semibold"}`}>{formatQty(i.quantity, i.unit)}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
