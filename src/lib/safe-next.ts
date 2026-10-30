/** Only allow same-site relative redirects (blocks open redirects like //evil.com or https://…). */
export function safeNext(value: unknown, fallback = "/plan"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
