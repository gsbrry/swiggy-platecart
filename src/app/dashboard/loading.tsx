/** Standard streaming loading UI — skeleton shapes only, no data. */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--sw-page)]">
      {/* Nav skeleton */}
      <div className="h-[58px] border-b border-[var(--sw-border)] glass-strong" />
      <div className="mx-auto max-w-[1100px] px-6 pt-5">
        {/* Hero */}
        <div className="mb-4 h-[90px] animate-pulse rounded-lg glass" />
        {/* Section title */}
        <div className="mb-3 mt-4 h-4 w-32 animate-pulse rounded bg-white/70 backdrop-blur-md" />
        {/* Meals grid */}
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[180px] animate-pulse rounded-lg glass"
            />
          ))}
        </div>
        {/* Week strip */}
        <div className="mb-4 h-[110px] animate-pulse rounded-lg glass" />
        {/* Bottom row */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[280px_1fr]">
          <div className="h-[280px] animate-pulse rounded-lg glass" />
          <div className="h-[280px] animate-pulse rounded-lg glass" />
        </div>
      </div>
    </div>
  );
}
