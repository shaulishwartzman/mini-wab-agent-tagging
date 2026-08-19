/**
 * Forced / voluntary password change page.
 *
 * Users with `mustChangePassword: true` are redirected here by `proxy.ts`
 * until they set a new password.
 *
 * @see components/auth/ChangePasswordForm.tsx
 * @see app/api/auth/change-password/route.ts
 * @see proxy.ts
 */

import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { getAuthSession } from "@/lib/auth/session";

/**
 * Change-password page — requires an authenticated session.
 */
export default async function ChangePasswordPage() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/login?callbackUrl=/change-password");
  }

  return (
    <AuthShell
      title="החלפת סיסמה"
      subtitle={
        session.user.mustChangePassword
          ? "זוהי התחברות ראשונה — יש להחליף את הסיסמה הזמנית לפני המשך השימוש"
          : "עדכנו את הסיסמה שלכם"
      }
    >
      <ChangePasswordForm />
    </AuthShell>
  );
}
