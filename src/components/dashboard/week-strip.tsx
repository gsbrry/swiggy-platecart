"use client";

import { useRouter } from "next/navigation";

type Props = {
  weekStart: Date;
  today: number; // 1..7 (Mon..Sun)
  doneDays: number[];
  eatoutDays: number[];
};

const DAY_ABBR = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Week strip — 7 day pills that navigate to /meal-plan?day=... */
export function WeekStrip({ weekStart, today, doneDays, eatoutDays }: Props) {
  const router = useRouter();
  const done = new Set(doneDays);
  const eatout = new Set(eatoutDays);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setUTCDate(weekStart.getUTCDate() + i);
    return {
      dow: i + 1, // 1..7 Mon..Sun
      date,
      iso: date.toISOString().slice(0, 10),
      short: DAY_ABBR[i],
      full: DAY_FULL[i],
      day: date.getUTCDate(),
    };
  });

  const handleClick = (iso: string) => {
    router.push(`/meal-plan?day=${iso}`);
  };

  return (
    <div className="mb-4 rounded-lg glass px-5 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold tracking-tight text-[var(--sw-charcoal)]">
          This Week
        </h2>
        <a
          href="/meal-plan"
          className="text-xs font-semibold text-[var(--sw-orange)] hover:opacity-80"
        >
          Full plan →
        </a>
      </div>
      <div className="mt-2.5 flex gap-1.5">
        {days.map((d) => {
          const isToday = d.dow === today;
          const isDone = done.has(d.dow) && !isToday;
          const isEatout = eatout.has(d.dow) && !isToday;
          const label = isToday
            ? `${d.full} ${d.day} ${MONTH[d.date.getUTCMonth()]}, today`
            : `${d.full} ${d.day} ${MONTH[d.date.getUTCMonth()]}`;
          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => handleClick(d.iso)}
              aria-label={label}
              aria-current={isToday ? "date" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg border border-transparent px-1 py-2.5 transition-colors ${
                isToday
                  ? "border-[var(--sw-orange)] bg-appetite"
                  : "hover:bg-[var(--sw-page)]"
              }`}
            >
              <span
                className={`text-[9px] font-bold tracking-wider ${
                  isToday ? "text-white" : "text-[var(--sw-muted)]"
                }`}
              >
                {d.short}
              </span>
              <span
                className={`text-sm font-bold ${
                  isToday ? "text-white" : "text-[var(--sw-charcoal)]"
                }`}
              >
                {d.day}
              </span>
              <span
                className={`h-[5px] w-[5px] rounded-full ${
                  isToday
                    ? "bg-white/60"
                    : isDone
                      ? "bg-[var(--sw-green)]"
                      : isEatout
                        ? "bg-[var(--sw-yellow)]"
                        : "bg-[var(--sw-border)]"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
