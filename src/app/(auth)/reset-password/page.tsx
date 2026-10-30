import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { requireUserId } from "@/lib/auth";

export const metadata = { title: "Set a new password" };

export default async function ResetPasswordPage() {
  // The reset link signs the user in via /auth/callback first.
  await requireUserId("/reset-password");
  return (
    <>
      <h1 className="mb-6 text-[28px] font-semibold leading-tight">Set a new password</h1>
      <ResetPasswordForm />
    </>
  );
}
