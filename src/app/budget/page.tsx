import { ShoppingBasket, UtensilsCrossed, Wallet, AlertCircle } from "lucide-react";

import { AppNav } from "@/components/app-nav";
import { getCurrentUser } from "@/lib/current-user";
import { mockBudget, mockUser, mockWastePatterns } from "@/lib/mock";
import { MonthSelector } from "./month-selector";

export const dynamic = "force-dynamic";

/** Deterministic weekly split for the current month (mock). */
const mockWeeklyTrend: Array<{ label: string; groceries: number; eatout: number }> = [
  { label: "W1", groceries: 1420, eatout: 320 },
  { label: "W2", groceries: 1180, eatout: 480 },
  { label: "W3", groceries: 1360, eatout: 260 },
  { label: "W4", groceries: 860, eatout: 290 },
];

type Txn = {
  id: string;
  date: string;
  source: "Instamart" | "Dineout";
  amount: number;
  hint: string;
};

const mockTransactions: Txn[] = [
  { id: "t1", date: "Jul 28", source: "Instamart", amount: 682, hint: "Dal Chawal restock" },
  { id: "t2", date: "Jul 27", source: "Dineout", amount: 540, hint: "Friday eat-out" },
  { id: "t3", date: "Jul 25", source: "Instamart", amount: 914, hint: "Paneer Bhurji + Roti" },
  { id: "t4", date: "Jul 23", source: "Instamart", amount: 448, hint: "Veg Curry basics" },
  { id: "t5", date: "Jul 22", source: "Dineout", amount: 480, hint: "Team lunch" },
  { id: "t6", date: "Jul 20", source: "Instamart", amount: 762, hint: "Khichdi week" },
  { id: "t7", date: "Jul 18", source: "Instamart", amount: 590, hint: "Poha + Oats" },
  { id: "t8", date: "Jul 15", source: "Dineout", amount: 330, hint: "Weeknight order" },
  { id: "t9", date: "Jul 12", source: "Instamart", amount: 924, hint: "Weekly staples" },
];

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function currentMonthLabel(): string {
  const now = new Date();
  return `${MONTH_NAMES[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
}

export default async function BudgetPage() {
  const user = (await getCurrentUser()) ?? mockUser;

  const monthlyBudget = user.monthlyBudget ? Number(user.monthlyBudget) : 12000;
  const spentGroceries = mockBudget.spentGroceries;
  const spentEatout = mockBudget.spentEatout;
  const totalSpent = spentGroceries + spentEatout;
  const remaining = Math.max(0, monthlyBudget - totalSpent);
  const pctSpent =
    monthlyBudget > 0 ? Math.min(100, Math.round((totalSpent / monthlyBudget) * 100)) : 0;

  const grocPct =
    totalSpent > 0 ? Math.round((spentGroceries / totalSpent) * 100) : 0;
  const eatPct = totalSpent > 0 ? 100 - grocPct : 0;

  const maxWeekly = Math.max(
    ...mockWeeklyTrend.map((w) => w.groceries + w.eatout),
    1,
  );

  const monthLabel = currentMonthLabel();

  return (
    <div className="min-h-screen bg-[var(--sw-page)]">
      <AppNav
        avatarInitials={(user.name ?? "U").slice(0, 2).toUpperCase()}
        spent={totalSpent}
        budget={monthlyBudget}
      />

      <main className="mx-auto max-w-[1100px] px-6 py-8">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-[var(--sw-charcoal)]">
              Budget tracker
            </h1>
            <p className="mt-1 text-sm text-[var(--sw-muted)]">
              Month-to-date spend split by groceries and eating out.
            </p>
          </div>
          <MonthSelector initialMonth={monthLabel} />
        </header>

        {/* 1. Overview card */}
        <section className="mb-6 rounded-lg glass p-6">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-stretch">
            <BigBudgetRing
              pctSpent={pctSpent}
              totalSpent={totalSpent}
              monthlyBudget={monthlyBudget}
            />
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
              <StatBlock
                icon={<ShoppingBasket className="h-4 w-4" />}
                label="Groceries spent"
                value={spentGroceries}
                accent="var(--sw-orange)"
              />
              <StatBlock
                icon={<UtensilsCrossed className="h-4 w-4" />}
                label="Eat-outs spent"
                value={spentEatout}
                accent="var(--sw-yellow)"
              />
              <StatBlock
                icon={<Wallet className="h-4 w-4" />}
                label="Remaining"
                value={remaining}
                accent="var(--sw-green)"
              />
            </div>
          </div>
        </section>

        {/* 2. Category breakdown */}
        <section className="mb-6 rounded-lg glass p-6">
          <h2 className="mb-4 text-[15px] font-bold tracking-tight text-[var(--sw-charcoal)]">
            Category breakdown
          </h2>
          <figure>
            <div
              className="flex h-6 w-full overflow-hidden rounded-full bg-[var(--sw-page)]"
              role="img"
              aria-label={`Groceries ${grocPct}%, eat-outs ${eatPct}%`}
            >
              <div
                className="h-full"
                style={{
                  width: `${grocPct}%`,
                  backgroundColor: "var(--sw-orange)",
                }}
              />
              <div
                className="h-full"
                style={{
                  width: `${eatPct}%`,
                  backgroundColor: "var(--sw-yellow)",
                }}
              />
            </div>
            <div className="mt-3 flex gap-4 text-[11px] text-[var(--sw-muted)]">
              <LegendDot color="var(--sw-orange)" label={`Groceries ${grocPct}%`} />
              <LegendDot color="var(--sw-yellow)" label={`Eat-outs ${eatPct}%`} />
            </div>
            <figcaption className="sr-only">
              Groceries account for {grocPct}% and eat-outs for {eatPct}% of ₹
              {totalSpent.toLocaleString("en-IN")} spent this month.
            </figcaption>
          </figure>

          <table className="mt-5 w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-[var(--sw-muted)]">
              <tr>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 text-right font-medium">Amount</th>
                <th className="pb-2 text-right font-medium">% of spend</th>
              </tr>
            </thead>
            <tbody className="text-[var(--sw-charcoal)]">
              <tr className="border-t border-[var(--sw-border)]">
                <td className="py-2.5">Groceries</td>
                <td className="py-2.5 text-right font-semibold">
                  ₹{spentGroceries.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 text-right">{grocPct}%</td>
              </tr>
              <tr className="border-t border-[var(--sw-border)]">
                <td className="py-2.5">Eat-outs</td>
                <td className="py-2.5 text-right font-semibold">
                  ₹{spentEatout.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 text-right">{eatPct}%</td>
              </tr>
              <tr className="border-t border-[var(--sw-border)] font-semibold">
                <td className="py-2.5">Total</td>
                <td className="py-2.5 text-right">
                  ₹{totalSpent.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 3. Weekly trend */}
        <section className="mb-6 rounded-lg glass p-6">
          <h2 className="mb-4 text-[15px] font-bold tracking-tight text-[var(--sw-charcoal)]">
            Weekly trend
          </h2>
          <figure>
            <div className="flex h-[180px] items-end justify-between gap-4 border-b border-[var(--sw-border)] pb-2">
              {mockWeeklyTrend.map((w) => {
                const total = w.groceries + w.eatout;
                const totalH = (total / maxWeekly) * 100;
                const grocH = total > 0 ? (w.groceries / total) * totalH : 0;
                const eatH = total > 0 ? (w.eatout / total) * totalH : 0;
                return (
                  <div key={w.label} className="flex flex-1 flex-col items-center">
                    <div className="text-[10px] font-semibold text-[var(--sw-muted)]">
                      ₹{total.toLocaleString("en-IN")}
                    </div>
                    <div className="relative mt-1 flex h-[130px] w-full max-w-[52px] flex-col justify-end">
                      <div
                        className="w-full rounded-t-sm"
                        style={{
                          height: `${eatH}%`,
                          backgroundColor: "var(--sw-yellow)",
                        }}
                      />
                      <div
                        className="w-full"
                        style={{
                          height: `${grocH}%`,
                          backgroundColor: "var(--sw-orange)",
                        }}
                      />
                    </div>
                    <div className="mt-2 text-xs font-medium text-[var(--sw-charcoal)]">
                      {w.label}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 text-[11px] text-[var(--sw-muted)]">
              <LegendDot color="var(--sw-orange)" label="Groceries" />
              <LegendDot color="var(--sw-yellow)" label="Eat-outs" />
            </div>
            <figcaption className="sr-only">
              Weekly spend: {mockWeeklyTrend
                .map(
                  (w) =>
                    `${w.label} ₹${(w.groceries + w.eatout).toLocaleString("en-IN")}`,
                )
                .join(", ")}
              .
            </figcaption>
          </figure>
        </section>

        {/* 4. Recent transactions */}
        <section className="mb-6 rounded-lg glass p-6">
          <h2 className="mb-4 text-[15px] font-bold tracking-tight text-[var(--sw-charcoal)]">
            Recent transactions
          </h2>
          <ul role="list" className="divide-y divide-[var(--sw-border)]">
            {mockTransactions.map((t) => (
              <li
                key={t.id}
                role="listitem"
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{
                      backgroundColor:
                        t.source === "Instamart"
                          ? "var(--sw-orange-tint)"
                          : "rgba(243,195,52,0.15)",
                      color:
                        t.source === "Instamart"
                          ? "var(--sw-orange)"
                          : "var(--sw-charcoal)",
                    }}
                    aria-hidden
                  >
                    {t.source === "Instamart" ? (
                      <ShoppingBasket className="h-4 w-4" />
                    ) : (
                      <UtensilsCrossed className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--sw-charcoal)]">
                      {t.source}
                    </div>
                    <div className="text-xs text-[var(--sw-muted)]">
                      {t.date} · {t.hint}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-[var(--sw-charcoal)]">
                  ₹{t.amount.toLocaleString("en-IN")}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 5. Waste insights */}
        <section className="rounded-lg glass p-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[var(--sw-orange)]" />
            <h2 className="text-[15px] font-bold tracking-tight text-[var(--sw-charcoal)]">
              Waste insights
            </h2>
          </div>
          {mockWastePatterns.length === 0 ? (
            <p className="text-sm text-[var(--sw-muted)]">
              No repeated over-buying detected this month.
            </p>
          ) : (
            <ul role="list" className="space-y-2">
              {mockWastePatterns.map((w) => (
                <li
                  key={w.ingredient_name}
                  role="listitem"
                  className="flex items-start gap-3 rounded-md bg-[var(--sw-page)] px-4 py-3"
                >
                  <span
                    className="mt-1 h-1.5 w-1.5 rounded-full bg-appetite"
                    aria-hidden
                  />
                  <p className="text-sm text-[var(--sw-charcoal)]">
                    You over-bought{" "}
                    <b className="font-semibold capitalize">{w.ingredient_name}</b>{" "}
                    {w.count} times — consider reducing quantity next order.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function BigBudgetRing({
  pctSpent,
  totalSpent,
  monthlyBudget,
}: {
  pctSpent: number;
  totalSpent: number;
  monthlyBudget: number;
}) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const spentLen = (circumference * pctSpent) / 100;
  const remainingLen = circumference - spentLen;
  const label = `Budget ring: ${pctSpent}% of ₹${monthlyBudget.toLocaleString("en-IN")} spent`;

  return (
    <div className="relative h-[200px] w-[200px] shrink-0">
      <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label={label}>
        <title>{label}</title>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#E9E9EB" strokeWidth="14" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--sw-orange)"
          strokeWidth="14"
          strokeDasharray={`${spentLen} ${remainingLen}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] uppercase tracking-wide text-[var(--sw-muted)]">
          Spent
        </div>
        <div className="text-[26px] font-bold leading-none tracking-tight text-[var(--sw-charcoal)]">
          ₹{totalSpent.toLocaleString("en-IN")}
        </div>
        <div className="mt-1 text-xs text-[var(--sw-muted)]">
          {pctSpent}% of ₹{monthlyBudget.toLocaleString("en-IN")}
        </div>
      </div>
    </div>
  );
}

function StatBlock({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--sw-border)] bg-[var(--sw-page)] px-4 py-3">
      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ backgroundColor: "white", color: accent }}
          aria-hidden
        >
          {icon}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--sw-muted)]">
          {label}
        </span>
      </div>
      <div className="mt-2 text-xl font-bold tracking-tight text-[var(--sw-charcoal)]">
        ₹{value.toLocaleString("en-IN")}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}
