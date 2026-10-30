export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "P") + (parts[1]?.[0] ?? "")).toUpperCase();
}
