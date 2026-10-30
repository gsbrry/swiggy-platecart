import Link from "next/link";
import { redirect } from "next/navigation";

import { AvatarEditor } from "@/components/me/avatar-editor";
import { PlanningForm, PreferencesForm, ProfileForm } from "@/components/me/forms";
import { deleteAccount } from "@/lib/actions/profile";
import { getMe } from "@/lib/auth";
import type { Diet } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Settings" };

const SECTIONS = [
  ["profile", "Profile"],
  ["food", "Food"],
  ["planning", "Planning"],
  ["account", "Account"],
] as const;

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await getMe();
  if (!me) redirect("/sign-in?next=/me/settings");
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const providers = (data.user?.identities ?? []).map((i) => i.provider);
  const email = data.user?.email ?? "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/me" className="text-sm font-medium text-ink-orange hover:underline">← My profile</Link>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight">Settings</h1>
      </div>

      <nav aria-label="Settings sections" className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="chip">{label}</a>
        ))}
      </nav>

      <section id="profile" aria-labelledby="profile-h" className="surface-solid scroll-mt-24 space-y-6 p-6">
        <h2 id="profile-h" className="text-lg font-semibold">Profile</h2>
        <AvatarEditor userId={me.id} name={me.profile.display_name} url={me.profile.avatar_url} hasGoogle={providers.includes("google")} />
        <ProfileForm initial={{ display_name: me.profile.display_name, username: me.profile.username ?? "", bio: me.profile.bio ?? "" }} />
      </section>

      <section id="food" aria-labelledby="food-h" className="surface-solid scroll-mt-24 space-y-4 p-6">
        <div>
          <h2 id="food-h" className="text-lg font-semibold">Food</h2>
          <p className="text-sm text-ink-muted">Private. Used to suggest dishes and size your shopping list.</p>
        </div>
        <PreferencesForm initial={{ diet: (me.settings.diet ?? "veg") as Diet, exclusions: me.settings.exclusions, household_size: me.settings.household_size }} />
      </section>

      <section id="planning" aria-labelledby="planning-h" className="surface-solid scroll-mt-24 space-y-4 p-6">
        <h2 id="planning-h" className="text-lg font-semibold">Planning</h2>
        <PlanningForm
          initial={{
            week_start: me.settings.week_start,
            default_visibility: me.settings.default_visibility,
            weekday_max_minutes: me.settings.weekday_max_minutes,
          }}
        />
      </section>

      <section id="account" aria-labelledby="account-h" className="surface-solid scroll-mt-24 space-y-5 p-6">
        <h2 id="account-h" className="text-lg font-semibold">Account</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-ink-muted">Email</dt>
            <dd className="font-medium">{email}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-muted">Sign-in methods</dt>
            <dd className="font-medium">
              {[providers.includes("google") && "Google", providers.includes("email") && "Email and password"].filter(Boolean).join(" · ") || "Email"}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Link href="/reset-password" className="btn-secondary btn-sm">{providers.includes("email") ? "Change password" : "Set a password"}</Link>
          <form action="/auth/sign-out" method="post">
            <button className="btn-ghost btn-sm">Sign out</button>
          </form>
        </div>

        <div className="space-y-3 rounded-xl border border-danger/25 p-5">
          <h3 className="font-semibold text-danger">Delete account</h3>
          <p className="text-sm text-ink-muted">Permanently deletes your account, photo, plan, dishes, menus and ratings. This can&apos;t be undone.</p>
          {error === "confirm" && <p role="alert" className="text-sm text-danger">Type DELETE to confirm.</p>}
          {error === "delete" && <p role="alert" className="text-sm text-danger">We couldn&apos;t delete your account. Please try again.</p>}
          <form action={deleteAccount} className="flex flex-wrap gap-2">
            <label htmlFor="confirm" className="sr-only">Type DELETE to confirm</label>
            <input id="confirm" name="confirm" placeholder="Type DELETE" className="input w-44" autoComplete="off" />
            <button className="btn btn-sm border border-danger text-danger hover:bg-danger/5">Delete my account</button>
          </form>
        </div>
      </section>
    </div>
  );
}
