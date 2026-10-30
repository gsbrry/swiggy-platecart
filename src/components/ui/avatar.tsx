import { initials } from "@/lib/initials";

/** Profile photo with an initials fallback. Plain <img> keeps it simple and CSP-friendly (Google + Supabase hosts allowed). */
export function Avatar({ name, url, size = 40, className = "" }: { name: string; url: string | null; size?: number; className?: string }) {
  const style = { width: size, height: size };
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small remote avatar; next/image would need remotePatterns + optimizer
      <img src={url} alt="" width={size} height={size} referrerPolicy="no-referrer" className={`shrink-0 rounded-full object-cover ${className}`} style={style} />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-[image:var(--action)] font-bold text-white ${className}`}
      style={{ ...style, fontSize: Math.round(size * 0.36) }}
    >
      {initials(name)}
    </span>
  );
}
