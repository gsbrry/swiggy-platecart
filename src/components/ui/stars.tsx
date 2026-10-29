import { Star } from "lucide-react";

export function Stars({ value, count, size = "sm" }: { value: number; count?: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <span className="inline-flex items-center gap-1" aria-label={count === 0 ? "No ratings yet" : `Rated ${value.toFixed(1)} out of 5${count ? ` from ${count} ratings` : ""}`}>
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={`${cls} ${i <= Math.round(value) ? "fill-[#E0A100] text-[#E0A100]" : "text-[rgb(43_29_26/0.2)]"}`} />
        ))}
      </span>
      {count !== undefined && (
        <span className="text-sm text-ink-muted" aria-hidden>
          {count === 0 ? "New" : `${value.toFixed(1)} (${count})`}
        </span>
      )}
    </span>
  );
}
