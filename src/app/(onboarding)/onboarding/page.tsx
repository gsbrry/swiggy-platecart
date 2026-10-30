import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getMe } from "@/lib/auth";

export const metadata = { title: "Set up" };

export default async function OnboardingPage() {
  const me = await getMe();
  if (!me) redirect("/sign-in?next=/onboarding");
  if (me.settings.onboarded) redirect("/plan");

  const suggested = (me.profile.username ?? me.profile.display_name)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 16);

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-app items-center px-4 sm:px-6">
        <Link href="/" aria-label="Planetto home"><Logo /></Link>
      </header>
      <main className="mx-auto max-w-xl px-4 pb-16 pt-4">
        <OnboardingFlow name={me.profile.display_name} suggestedUsername={suggested.length >= 3 ? suggested : ""} />
      </main>
    </div>
  );
}
