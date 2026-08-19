/**
 * Dedicated login page for SYSTEM_ADMIN users.
 *
 * Provides a clean, focused login experience without the organization field.
 * Redirects already-authenticated admins to /admin.
 *
 * Public route (added to proxy.ts PUBLIC_ROUTES).
 *
 * @see components/auth/AdminLoginForm.tsx - Login form component
 * @see lib/auth/auth-options.ts - SYSTEM_ADMIN auth logic
 */

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { UserRole } from "@/lib/types";
import { AuthShell } from "@/components/auth/AuthShell";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import Link from "next/link";

export default async function AdminLoginPage() {
  const user = await getAuthUser();

  if (user) {
    if (user.role === UserRole.SYSTEM_ADMIN) {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <AuthShell
      title="כניסת מנהל מערכת"
      subtitle="התחברות למערכת הניהול הראשית"
      footer={
        <Link
          href="/login"
          style={{
            color: "#3b82f6",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          חזרה לכניסה רגילה →
        </Link>
      }
    >
      <AdminLoginForm />
    </AuthShell>
  );
}
