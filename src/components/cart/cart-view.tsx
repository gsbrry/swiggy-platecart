"use client";

import {
  Check,
  Loader2,
  Minus,
  Plus,
  Save,
  ShoppingCart,
  Trash2,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export type MealSource = {
  templateId: string;
  dishName: string;
};

type Props = {
  templateIds: string[];
  /** Map templateId -> the meal that first requested it, used for the "from" chip. */
  sources: Record<string, MealSource>;
};

type ApiCartItem = {
  ingredient_name: string;
  quantity: number;
  unit: string;
  instamart_search_hint: string | null;
};

type LineItem = ApiCartItem & {
  id: string;
  originalQty: number;
  pricePerUnit: number;
  category: Category;
  sourceDish: string;
};

type Category = "produce" | "dairy" | "pantry" | "spices";
type GroupMode = "meal" | "category";

const DELIVERY_FEE = 40;

const CATEGORY_LABEL: Record<Category, string> = {
  produce: "Produce",
  dairy: "Dairy",
  pantry: "Pantry",
  spices: "Spices",
};

const DAIRY = ["paneer", "milk", "curd", "ghee", "butter", "cheese"];
const PRODUCE = [
  "onion",
  "tomato",
  "spinach",
  "coriander leaves",
  "coriander",
  "potato",
  "carrot",
  "cucumber",
  "capsicum",
  "ginger",
  "garlic",
  "lemon",
  "beans",
  "cauliflower",
  "peas",
];
const SPICES = [
  "turmeric",
  "cumin",
  "chilli",
  "chili",
  "garam masala",
  "coriander powder",
  "mustard seeds",
  "hing",
  "asafoetida",
];

function classify(name: string): Category {
  const n = name.toLowerCase();
  if (SPICES.some((k) => n.includes(k))) return "spices";
  if (DAIRY.some((k) => n.includes(k))) return "dairy";
  if (PRODUCE.some((k) => n.includes(k))) return "produce";
  return "pantry";
}

/** Deterministic per-name price in the ₹40..120 range. */
function priceFor(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const span = 120 - 40;
  return 40 + (Math.abs(h) % (span + 1));
}

/** Best-effort mapping ingredient -> source dish, based on which templates use it. */
function guessSource(
  ingredient: string,
  sources: Record<string, MealSource>,
): string {
  const n = ingredient.toLowerCase();
  const dishes = Object.values(sources).map((s) => s.dishName);
  const pick = (needle: string, dish: string): string | null =>
    dishes.find((d) => d.toLowerCase().includes(needle)) ? dish : null;
  if (n.includes("paneer")) {
    const d = pick("paneer", "Paneer Bhurji + Roti");
    if (d) return d;
  }
  if (n.includes("moong") || n.includes("dal")) {
    const d = dishes.find((x) => /dal|khichdi|poha/i.test(x));
    if (d) return d;
  }
  if (n.includes("atta")) {
    const d = dishes.find((x) => /roti|paneer|veg curry/i.test(x));
    if (d) return d;
  }
  if (n.includes("onion") || n.includes("tomato")) {
    const d = dishes.find((x) => /paneer|veg|dal|khichdi/i.test(x));
    if (d) return d;
  }
  return dishes[0] ?? "Meal plan";
}

export function CartView({ templateIds, sources }: Props) {
  const [items, setItems] = useState<LineItem[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupMode>("meal");
  const [sending, setSending] = useState(false);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Toast auto-dismiss.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // Build the cart on mount.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/cart/build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template_ids: templateIds,
            date: new Date().toISOString().slice(0, 10),
          }),
        });
        if (!res.ok) throw new Error(`build failed: ${res.status}`);
        const data = (await res.json()) as { items: ApiCartItem[] };
        if (cancelled) return;
        const mapped: LineItem[] = data.items.map((it, i) => ({
          ...it,
          id: `li-${i}-${it.ingredient_name.toLowerCase().replace(/\s+/g, "-")}`,
          originalQty: it.quantity,
          pricePerUnit: priceFor(it.ingredient_name),
          category: classify(it.ingredient_name),
          sourceDish: guessSource(it.ingredient_name, sources),
        }));
        setItems(mapped);
      } catch (err) {
        if (cancelled) return;
        console.error("[cart] build", err);
        setLoadErr("Could not build your cart. Try again.");
        setItems([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [templateIds, sources]);

  const activeItems = useMemo(
    () => (items ?? []).filter((i) => i.quantity > 0),
    [items],
  );
  const itemCount = activeItems.length;
  const estimatedCost = useMemo(
    () =>
      activeItems.reduce((sum, it) => {
        const ratio = it.originalQty > 0 ? it.quantity / it.originalQty : 1;
        return sum + Math.round(it.pricePerUnit * ratio);
      }, 0),
    [activeItems],
  );
  const total = estimatedCost + (itemCount > 0 ? DELIVERY_FEE : 0);

  const stepQty = useCallback((id: string, delta: number) => {
    setItems((curr) =>
      curr
        ? curr.map((it) => {
            if (it.id !== id) return it;
            const step = it.unit === "g" ? 50 : 1;
            const next = Math.max(0, it.quantity + delta * step);
            return { ...it, quantity: next };
          })
        : curr,
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((curr) =>
      curr ? curr.map((it) => (it.id === id ? { ...it, quantity: 0 } : it)) : curr,
    );
  }, []);

  const restoreItem = useCallback((id: string) => {
    setItems((curr) =>
      curr
        ? curr.map((it) =>
            it.id === id ? { ...it, quantity: it.originalQty } : it,
          )
        : curr,
    );
  }, []);

  const sendToInstamart = useCallback(async () => {
    if (!items || sending || itemCount === 0) return;
    setSending(true);
    try {
      const payload = {
        items: activeItems.map((it) => ({
          ingredient_name: it.ingredient_name,
          quantity: it.quantity,
          unit: it.unit,
          instamart_search_hint: it.instamart_search_hint,
        })),
      };
      const res = await fetch("/api/cart/add-to-instamart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`add-to-instamart failed: ${res.status}`);
      const data = (await res.json()) as { order_ref?: string };
      setOrderRef(data.order_ref ?? "mock-unknown");
    } catch (err) {
      console.error("[cart] send-to-instamart", err);
      setToast("Could not send to Instamart — see console");
    } finally {
      setSending(false);
    }
  }, [items, sending, itemCount, activeItems]);

  const saveCart = useCallback(() => {
    console.log("[cart] save-cart", activeItems);
    setToast("Cart saved locally");
  }, [activeItems]);

  // Success screen — takes over the page after "Send to Instamart".
  if (orderRef) {
    return <SuccessScreen orderRef={orderRef} itemCount={itemCount} total={total} />;
  }

  return (
    <div className="mx-auto max-w-[1160px] px-5 pb-10 pt-[18px]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-[22px] font-bold tracking-tight text-[var(--sw-charcoal)]">
          This week&apos;s cart
        </h1>
        <p className="mt-1 text-[13px] text-[var(--sw-muted)]">
          Ingredients aggregated from your meal plan
        </p>
      </div>

      {/* Group toggle */}
      <div
        role="tablist"
        aria-label="Group cart items"
        className="mb-4 inline-flex rounded-lg glass p-1"
      >
        <GroupTab
          active={group === "meal"}
          onClick={() => setGroup("meal")}
          label="By meal"
        />
        <GroupTab
          active={group === "category"}
          onClick={() => setGroup("category")}
          label="By category"
        />
      </div>

      {/* Layout */}
      <div className="grid gap-3.5 lg:grid-cols-[1fr_320px]">
        {/* LEFT — line items */}
        <div className="min-w-0">
          {items === null ? (
            <LoadingCard />
          ) : loadErr ? (
            <div className="rounded-lg glass p-8 text-center text-sm text-[var(--sw-muted)]">
              {loadErr}
            </div>
          ) : activeItems.length === 0 ? (
            <EmptyState />
          ) : group === "meal" ? (
            <GroupedByMeal items={activeItems} allItems={items} stepQty={stepQty} removeItem={removeItem} restoreItem={restoreItem} />
          ) : (
            <GroupedByCategory items={activeItems} allItems={items} stepQty={stepQty} removeItem={removeItem} restoreItem={restoreItem} />
          )}

          {/* Removed items row — quick undo */}
          {items && items.some((i) => i.quantity === 0) && (
            <div className="mt-3 rounded-lg border border-dashed border-[var(--sw-border)] bg-white/70 px-4 py-3">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--sw-muted)]">
                Removed
              </div>
              <div className="flex flex-wrap gap-2">
                {items
                  .filter((i) => i.quantity === 0)
                  .map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => restoreItem(i.id)}
                      className="flex items-center gap-1.5 rounded-full glass px-2.5 py-1 text-[11px] font-semibold text-[var(--sw-charcoal)] transition hover:border-[var(--sw-orange)] hover:text-[var(--sw-orange)]"
                    >
                      <Undo2 className="h-3 w-3" />
                      {i.ingredient_name}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — sticky summary */}
        <aside className="lg:sticky lg:top-[74px] lg:self-start">
          <div className="rounded-lg glass p-5">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--sw-muted)]">
              Order summary
            </div>
            <div aria-live="polite" className="space-y-2 text-[13px]">
              <SumRow label={`Items (${itemCount})`} value={`₹${estimatedCost}`} />
              <SumRow
                label="Delivery fee"
                value={itemCount > 0 ? `₹${DELIVERY_FEE}` : "—"}
              />
              <div className="my-2 border-t border-[var(--sw-border)]" />
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[var(--sw-charcoal)]">
                  Total
                </span>
                <span className="text-[18px] font-bold tracking-tight text-[var(--sw-charcoal)]">
                  ₹{total}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={sendToInstamart}
              disabled={sending || itemCount === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-appetite px-3 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? (
                <>
                  <Loader2 className="h-[15px] w-[15px] animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-[15px] w-[15px]" />
                  Send to Instamart
                </>
              )}
            </button>
            <button
              type="button"
              onClick={saveCart}
              disabled={itemCount === 0}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-[var(--sw-border)] bg-white/70 backdrop-blur-md px-3 py-2 text-[13px] font-semibold text-[var(--sw-charcoal)] transition hover:border-[#C0C0C4] hover:bg-[var(--sw-page)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="h-[15px] w-[15px]" />
              Save cart
            </button>

            <p className="mt-3 text-[11px] leading-relaxed text-[var(--sw-muted)]">
              Prices are estimates. Final cost is set by Instamart at checkout.
            </p>
          </div>
        </aside>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 left-1/2 z-[300] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--sw-charcoal)] px-5 py-2.5 text-xs font-semibold text-white shadow-lg"
        >
          <Check className="h-[15px] w-[15px]" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

/* --- Sub-components (kept in-file to avoid noise) --- */

function GroupTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      role="tab"
      type="button"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-appetite text-white"
          : "text-[var(--sw-muted)] hover:text-[var(--sw-charcoal)]"
      }`}
    >
      {label}
    </button>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--sw-muted)]">{label}</span>
      <span className="font-semibold text-[var(--sw-charcoal)]">{value}</span>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="flex items-center justify-center rounded-lg glass p-10 text-sm text-[var(--sw-muted)]">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Building your cart…
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[var(--sw-border)] bg-white/70 backdrop-blur-md px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sw-orange-tint)] text-[var(--sw-orange)]">
        <ShoppingCart className="h-5 w-5" />
      </div>
      <div className="text-sm font-semibold text-[var(--sw-charcoal)]">
        Your cart is empty
      </div>
      <p className="mt-1 text-[12px] text-[var(--sw-muted)]">
        Add meals to your plan to build one.
      </p>
      <Link
        href="/meal-plan"
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-appetite px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
      >
        Go to Meal Plan
      </Link>
    </div>
  );
}

type RowProps = {
  item: LineItem;
  stepQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  restoreItem: (id: string) => void;
  showChip?: boolean;
};

function LineRow({ item, stepQty, removeItem, restoreItem, showChip = true }: RowProps) {
  const removed = item.quantity === 0;
  return (
    <div
      role="listitem"
      className={`flex items-center gap-3 px-4 py-3 transition ${
        removed ? "opacity-60" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13.5px] font-bold tracking-tight text-[var(--sw-charcoal)]">
            {item.ingredient_name}
          </span>
          {showChip && (
            <span className="shrink-0 rounded-full bg-[var(--sw-page)] px-2 py-0.5 text-[10px] font-semibold text-[var(--sw-muted)]">
              {item.sourceDish}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--sw-muted)]">
          <span>
            {item.quantity} {item.unit}
          </span>
          <span>·</span>
          <span>
            est. ₹
            {Math.round(
              item.pricePerUnit *
                (item.originalQty > 0 ? item.quantity / item.originalQty : 1),
            )}
          </span>
        </div>
      </div>

      {removed ? (
        <button
          type="button"
          onClick={() => restoreItem(item.id)}
          className="flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-[11px] font-semibold text-[var(--sw-charcoal)] transition hover:border-[var(--sw-orange)] hover:text-[var(--sw-orange)]"
        >
          <Undo2 className="h-3 w-3" />
          Restore
        </button>
      ) : (
        <>
          <div className="flex items-center gap-1 rounded-full glass px-1 py-1">
            <button
              type="button"
              aria-label={`Decrease quantity of ${item.ingredient_name}`}
              onClick={() => stepQty(item.id, -1)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--sw-charcoal)] transition hover:bg-[var(--sw-page)] focus-visible:outline-2 focus-visible:outline-[var(--sw-orange)]"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="min-w-[36px] text-center text-[12px] font-bold tabular-nums text-[var(--sw-charcoal)]">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label={`Increase quantity of ${item.ingredient_name}`}
              onClick={() => stepQty(item.id, 1)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--sw-charcoal)] transition hover:bg-[var(--sw-page)] focus-visible:outline-2 focus-visible:outline-[var(--sw-orange)]"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <button
            type="button"
            aria-label={`Remove ${item.ingredient_name}`}
            onClick={() => removeItem(item.id)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--sw-muted)] transition hover:bg-[var(--sw-page)] hover:text-[var(--sw-charcoal)]"
          >
            <Trash2 className="h-[15px] w-[15px]" />
          </button>
        </>
      )}
    </div>
  );
}

function SectionCard({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 overflow-hidden rounded-lg glass">
      <div className="flex items-center justify-between border-b border-[var(--sw-border)] bg-[var(--sw-page)] px-4 py-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--sw-muted)]">
          {title}
        </span>
        <span className="text-[10px] font-semibold text-[var(--sw-muted)]">
          {count} {count === 1 ? "item" : "items"}
        </span>
      </div>
      <div role="list" className="divide-y divide-[var(--sw-border)]">
        {children}
      </div>
    </div>
  );
}

function GroupedByMeal({
  items,
  stepQty,
  removeItem,
  restoreItem,
}: {
  items: LineItem[];
  allItems: LineItem[];
  stepQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  restoreItem: (id: string) => void;
}) {
  const groups = new Map<string, LineItem[]>();
  for (const it of items) {
    const arr = groups.get(it.sourceDish) ?? [];
    arr.push(it);
    groups.set(it.sourceDish, arr);
  }
  const entries = Array.from(groups.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return (
    <>
      {entries.map(([dish, list]) => (
        <SectionCard key={dish} title={dish} count={list.length}>
          {list.map((it) => (
            <LineRow
              key={it.id}
              item={it}
              stepQty={stepQty}
              removeItem={removeItem}
              restoreItem={restoreItem}
              showChip={false}
            />
          ))}
        </SectionCard>
      ))}
    </>
  );
}

function GroupedByCategory({
  items,
  stepQty,
  removeItem,
  restoreItem,
}: {
  items: LineItem[];
  allItems: LineItem[];
  stepQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  restoreItem: (id: string) => void;
}) {
  const order: Category[] = ["produce", "dairy", "pantry", "spices"];
  const groups: Record<Category, LineItem[]> = {
    produce: [],
    dairy: [],
    pantry: [],
    spices: [],
  };
  for (const it of items) groups[it.category].push(it);
  return (
    <>
      {order
        .filter((c) => groups[c].length > 0)
        .map((c) => (
          <SectionCard key={c} title={CATEGORY_LABEL[c]} count={groups[c].length}>
            {groups[c].map((it) => (
              <LineRow
                key={it.id}
                item={it}
                stepQty={stepQty}
                removeItem={removeItem}
                restoreItem={restoreItem}
              />
            ))}
          </SectionCard>
        ))}
    </>
  );
}

function SuccessScreen({
  orderRef,
  itemCount,
  total,
}: {
  orderRef: string;
  itemCount: number;
  total: number;
}) {
  return (
    <div className="mx-auto max-w-[560px] px-5 pb-10 pt-16">
      <div className="rounded-lg glass p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sw-orange-tint)] text-[var(--sw-orange)]">
          <Check className="h-6 w-6" />
        </div>
        <h1 className="text-[20px] font-bold tracking-tight text-[var(--sw-charcoal)]">
          Cart sent to Instamart
        </h1>
        <p className="mt-1.5 text-[13px] text-[var(--sw-muted)]">
          {itemCount} items · ₹{total} total
        </p>
        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--sw-page)] px-3.5 py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--sw-muted)]">
            Order ref
          </span>
          <span className="font-mono text-[12px] font-bold text-[var(--sw-charcoal)]">
            {orderRef}
          </span>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg bg-appetite px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/meal-plan"
            className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-[var(--sw-border)] bg-white/70 backdrop-blur-md px-3.5 py-[7px] text-xs font-semibold text-[var(--sw-charcoal)] transition hover:border-[#C0C0C4] hover:bg-[var(--sw-page)]"
          >
            View Meal Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
