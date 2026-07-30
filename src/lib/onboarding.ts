/** True when the user has not finished the onboarding preferences flow. */
export function needsOnboarding(user: {
  goal?: string | null;
  dietType?: string | null;
}): boolean {
  return !user.goal || !user.dietType;
}
