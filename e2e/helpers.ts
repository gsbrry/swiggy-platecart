import type { BrowserContext } from "@playwright/test";

export const USER_ID = "11111111-1111-4111-8111-111111111111";
export const NEW_USER_ID = "33333333-3333-4333-8333-333333333333";

const b64u = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");

/** Sign in by planting the Supabase session cookie the app's SSR client reads. */
export async function signIn(context: BrowserContext, sub = USER_ID) {
  const token = `${b64u({ alg: "HS256", typ: "JWT" })}.${b64u({ sub, role: "authenticated", aud: "authenticated", exp: 4102444800 })}.sig`;
  const session = { access_token: token, refresh_token: "r", expires_at: 4102444800, expires_in: 99999999, token_type: "bearer", user: { id: sub } };
  await context.addCookies([
    { name: "sb-localhost-auth-token", value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"), domain: "localhost", path: "/" },
  ]);
}
