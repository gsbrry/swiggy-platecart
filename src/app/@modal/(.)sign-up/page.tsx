import { AuthModal } from "@/components/auth/auth-modal";
import { SignUpPanel } from "@/components/auth/auth-panels";
import { safeNext } from "@/lib/safe-next";

export default async function SignUpModal({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <AuthModal label="Create account">
      <SignUpPanel next={safeNext(sp.next)} inModal />
    </AuthModal>
  );
}
