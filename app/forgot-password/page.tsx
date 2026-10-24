/**
 * Forgot password page.
 *
 * Allows users to request a password reset link via email.
 * No authentication required.
 *
 * @see components/auth/ForgotPasswordForm.tsx
 * @see app/api/auth/forgot-password/route.ts
 */

import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

/**
 * Forgot password page - public access.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthShell title="איפוס סיסמה / Password Reset">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
