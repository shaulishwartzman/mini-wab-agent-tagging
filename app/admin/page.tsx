/**
 * System Admin panel page.
 *
 * Features:
 * - View all organizations in the system
 * - Drill-down to view users in any organization
 * - Read-only access (no org-specific actions in MVP)
 *
 * Protected: SYSTEM_ADMIN role only.
 * Non-admins are redirected to /dashboard by proxy.ts.
 *
 * @see components/admin/AdminDashboard.tsx - Client component
 * @see app/api/organizations/route.ts - GET organizations API
 * @see lib/errors/admin.ts - Hebrew labels
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { UserRole } from "@/lib/types";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminLabels } from "@/lib/errors/admin";

export default async function AdminPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (user.role !== UserRole.SYSTEM_ADMIN) {
    redirect("/dashboard");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 12,
            }}
            dir="rtl"
          >
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                {AdminLabels.pageTitle}
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: "#64748b",
                  margin: "8px 0 0",
                }}
              >
                {user.name} · {user.email}
              </p>
            </div>

            {/* Navigation buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
                href="/dashboard"
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid #3b82f6",
                  backgroundColor: "#eff6ff",
                  color: "#1e40af",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                לוח הבקרה
              </Link>
              <form action="/api/auth/signout" method="POST" style={{ margin: 0 }}>
                <button
                  type="submit"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #ef4444",
                    backgroundColor: "transparent",
                    color: "#dc2626",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  התנתקות
                </button>
              </form>
            </div>
          </div>
        </header>

        <AdminDashboard />
      </div>
    </main>
  );
}
