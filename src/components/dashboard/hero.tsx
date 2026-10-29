import { VoiceButton } from "./voice-button";

type Props = {
  greeting: string;
  goalLabel: string;
  weekStart: Date;
};

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Hero — greeting + goal metadata + voice CTA. */
export function Hero({ greeting, goalLabel, weekStart }: Props) {
  const today = new Date();
  const dateLabel = `${WEEKDAY[today.getDay()]} ${today.getDate()} ${MONTH[today.getMonth()]}`;

  // Very rough week-of-programme calculation — real value should come from the plan.
  const weeksIn = Math.max(
    1,
    Math.floor((today.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 3,
  );

  return (
    <div className="mb-4 flex flex-col gap-4 rounded-lg glass p-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="mb-1.5 text-[20px] font-bold tracking-tight text-[var(--sw-charcoal)]">
          {greeting} <span aria-hidden>👋</span>
        </h1>
        <p className="flex flex-wrap items-center gap-2 text-[13px] text-[var(--sw-muted)]">
          <span className="rounded-full bg-[var(--sw-orange-tint)] px-2 py-0.5 text-[11px] font-semibold text-[var(--sw-orange)]">
            Restock in 1 day
          </span>
          <span>
            {dateLabel} · {goalLabel} · Week {weeksIn}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right text-xs leading-snug text-[var(--sw-muted)] md:block">
          Say a dish name or
          <br />
          tap to add to cart
        </div>
        <VoiceButton />
      </div>
    </div>
  );
}
