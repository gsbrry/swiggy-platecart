import { AuthModal } from "@/components/auth/auth-modal";
import { SignInPanel } from "@/components/auth/auth-panels";
import { safeNext } from "@/lib/safe-next";

/** Intercepts in-app links to /sign-in and shows them as a popup over the current page. */
export default async function SignInModal({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <AuthModal label="Sign in">
      <SignInPanel next={safeNext(sp.next)} error={sp.error} inModal />
    </AuthModal>
  );
}
