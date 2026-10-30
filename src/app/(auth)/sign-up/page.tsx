import { SignUpPanel } from "@/components/auth/auth-panels";
import { safeNext } from "@/lib/safe-next";

export const metadata = { title: "Create account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return <SignUpPanel next={safeNext(sp.next)} />;
}
