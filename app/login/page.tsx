/**
 * Login page — organization name + email + password.
 *
 * Public route. Authenticated users are redirected to the dashboard
 * (or change-password when required).
 *
 * @see components/auth/LoginForm.tsx
 * @see lib/auth/auth-options.ts
 */

import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getAuthSession } from "@/lib/auth/session";

/**
 * Login page (server component) with client form.
 */
export default async function LoginPage() {
  const session = await getAuthSession();
  if (session?.user) {
    if (session.user.mustChangePassword) {
      redirect("/change-password");
    }
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="התחברות"
      subtitle="הזינו את שם הארגון, האימייל והסיסמה"
      footer={
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            אין לכם ארגון?{" "}
            <Link href="/register-org" style={{ color: "#1e40af", fontWeight: 600 }}>
              רישום ארגון חדש
            </Link>
            {" · "}
            <Link href="/" style={{ color: "#64748b" }}>
              חזרה לדף הבית
            </Link>
          </div>
          <div>
            <Link
              href="/admin/login"
              style={{ color: "#7c3aed", fontWeight: 500, fontSize: 13 }}
            >
              כניסת מנהל מערכת →
            </Link>
          </div>
        </div>
      }
    >
      <Suspense fallback={<p style={{ textAlign: "center" }}>טוען…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
