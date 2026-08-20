/** Cookie set when the user signs out in mock mode (no Clerk session to clear). */
export const MOCK_SIGNED_OUT_COOKIE = "platecart_mock_signed_out";

/** Mark mock mode as signed in — call before navigating to protected routes. */
export function establishMockSession(): void {
  document.cookie = `${MOCK_SIGNED_OUT_COOKIE}=; path=/; max-age=0`;
}

/** Mark mock mode as signed out and block protected routes until sign-in again. */
export function clearMockSession(): void {
  document.cookie = `${MOCK_SIGNED_OUT_COOKIE}=1; path=/; SameSite=Lax; max-age=86400`;
}
