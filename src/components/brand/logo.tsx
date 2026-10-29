/** Wordmark — the single place the app name is rendered as a logo. */
export const APP_NAME = "Planetto";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-[19px] font-bold tracking-tight text-ink ${className}`}>
      <svg aria-hidden viewBox="0 0 64 64" className="h-7 w-7">
        <defs>
          <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF8A1F" />
            <stop offset=".5" stopColor="#F26419" />
            <stop offset="1" stopColor="#E63946" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#logo-g)" />
        <circle cx="32" cy="32" r="17" fill="none" stroke="#fff" strokeWidth="5" />
        <circle cx="32" cy="32" r="7" fill="#fff" />
      </svg>
      <span>
        Plan<span className="text-ink-orange">etto</span>
      </span>
    </span>
  );
}
