/** Calendar helpers. Plan dates are plain YYYY-MM-DD in India time; never UTC midnights. */

export const TIME_ZONE = "Asia/Kolkata";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && ISO.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z"));
}

/** Today's date in India as YYYY-MM-DD. */
export function todayIso(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

function toUtc(iso: string): Date {
  return new Date(iso + "T00:00:00Z");
}

export function addDays(iso: string, days: number): string {
  const d = toUtc(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `iso`. */
export function mondayOf(iso: string): string {
  const dow = toUtc(iso).getUTCDay(); // 0 = Sun
  return addDays(iso, -((dow + 6) % 7));
}

export function weekDates(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function formatDay(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", ...opts }).format(toUtc(iso));
}

export function weekLabel(monday: string): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.slice(0, 7) === sunday.slice(0, 7);
  const start = formatDay(monday, sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" });
  return `${start} – ${formatDay(sunday, { day: "numeric", month: "short", year: "numeric" })}`;
}
