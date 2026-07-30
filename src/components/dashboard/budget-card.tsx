type Props = {
  monthlyBudget: number;
  totalSpent: number;
  pctSpent: number;
  remaining: number;
  eatoutUsed: number;
  eatoutQuota: number;
};

/** Budget ring — SVG circle, no CSS progress bar (per UI rules). */
export function BudgetCard({
  monthlyBudget,
  totalSpent,
  pctSpent,
  eatoutUsed,
  eatoutQuota,
}: Props) {
  // Ring maths — r=50, C = 2πr ≈ 314.16
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ≈ 314.16
  const spentLen = (circumference * pctSpent) / 100;
  const remainingLen = circumference - spentLen;

  if (monthlyBudget === 0) {
    return (
      <div className="rounded-lg border border-[var(--sw-border)] bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-bold tracking-tight text-[var(--sw-charcoal)]">
            Monthly Budget
          </h2>
          <a
            href="/settings"
            className="text-xs font-semibold text-[var(--sw-orange)] hover:opacity-80"
          >
            Details →
          </a>
        </div>
        <p className="mt-6 text-center text-sm text-[var(--sw-muted)]">
          Set your budget in Settings to see this
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center rounded-lg border border-[var(--sw-border)] bg-white px-5 py-4">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-[15px] font-bold tracking-tight text-[var(--sw-charcoal)]">
          Monthly Budget
        </h2>
        <a
          href="/budget"
          className="text-xs font-semibold text-[var(--sw-orange)] hover:opacity-80"
        >
          Details →
        </a>
      </div>

      <div className="relative mx-auto my-2 h-[130px] w-[130px]">
        <svg
          width="130"
          height="130"
          viewBox="0 0 130 130"
          role="img"
          aria-label={`Budget: ${pctSpent}% spent`}
        >
          <title>Budget: {pctSpent}% spent</title>
          {/* Track */}
          <circle cx="65" cy="65" r={radius} fill="none" stroke="#E9E9EB" strokeWidth="10" />
          {/* Spent — starts at top (rotate -90deg) */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke="#FC8019"
            strokeWidth="10"
            strokeDasharray={`${spentLen} ${remainingLen}`}
            strokeDashoffset={circumference / 4}
            strokeLinecap="round"
            transform="rotate(-90 65 65)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-lg font-bold leading-none tracking-tight text-[var(--sw-charcoal)]">
            ₹{totalSpent.toLocaleString("en-IN")}
          </div>
          <div className="mt-0.5 text-[10px] text-[var(--sw-muted)]">
            of ₹{monthlyBudget.toLocaleString("en-IN")} · {pctSpent}%
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-3.5">
        <Legend color="var(--sw-orange)" label="Spent" />
        <Legend color="var(--sw-border)" label="Remaining" />
      </div>

      <div className="mt-3 flex w-full items-center justify-between rounded-lg bg-[var(--sw-page)] px-3 py-2.5">
        <div className="text-xs font-medium text-[var(--sw-charcoal)]">Eat-outs this week</div>
        <div className="flex gap-1">
          {Array.from({ length: eatoutQuota }, (_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${
                i < eatoutUsed ? "bg-[var(--sw-orange)]" : "bg-[var(--sw-border)]"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1 text-[11px] text-[var(--sw-muted)]">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {label}
    </div>
  );
}
