/** Shared by the live checklist in the browser and the server action, so both always agree. */
export const PASSWORD_RULES = [
  { id: "length", label: "At least 10 characters", test: (p: string) => p.length >= 10 && p.length <= 72 },
  { id: "mix", label: "Letters and numbers", test: (p: string) => /[A-Za-z]/.test(p) && /\d/.test(p) },
] as const;

export function passwordProblem(p: string): string | null {
  if (p.length > 72) return "Use at most 72 characters.";
  const failed = PASSWORD_RULES.find((r) => !r.test(p));
  return failed ? `Password needs: ${failed.label.toLowerCase()}.` : null;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
