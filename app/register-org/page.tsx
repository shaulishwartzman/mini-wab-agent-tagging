/**
 * Organization registration page.
 *
 * Collects organization name and the first CISO user (required).
 * Submits via `registerOrganization()` → `POST /api/organizations` (Step 4).
 *
 * @see components/auth/RegisterOrgForm.tsx
 * @see lib/api/organizations.ts
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterOrgForm } from "@/components/auth/RegisterOrgForm";
import { getAuthSession } from "@/lib/auth/session";

/**
 * Register-organization page for guests.
 */
export default async function RegisterOrgPage() {
  const session = await getAuthSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="רישום ארגון חדש"
      subtitle="צרו ארגון והגדירו לפחות משתמש CISO אחד"
      footer={
        <>
          כבר רשומים?{" "}
          <Link href="/login" style={{ color: "#1e40af", fontWeight: 600 }}>
            התחברות
          </Link>
          {" · "}
          <Link href="/" style={{ color: "#64748b" }}>
            חזרה לדף הבית
          </Link>
        </>
      }
    >
      <RegisterOrgForm />
    </AuthShell>
  );
}
