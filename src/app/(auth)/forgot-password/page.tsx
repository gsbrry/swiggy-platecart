import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-[28px] font-semibold leading-tight">Reset your password</h1>
      <p className="mb-6 mt-1 text-ink-muted">We&apos;ll email you a link to set a new one.</p>
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm">
        <Link href="/sign-in" className="font-semibold text-ink-orange hover:underline">Back to sign in</Link>
      </p>
    </>
  );
}
