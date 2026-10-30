import { SignInPanel } from "@/components/auth/auth-panels";
import { safeNext } from "@/lib/safe-next";

export const metadata = { title: "Sign in" };

/** Full-page sign-in for direct visits (bookmarks, email links, redirects). In-app links open it as a popup. */
export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return <SignInPanel next={safeNext(sp.next)} error={sp.error} />;
}
