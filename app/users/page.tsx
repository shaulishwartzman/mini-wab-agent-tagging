/**
 * User management page for CISO and MANAGER roles.
 *
 * Features:
 * - List all users in the current organization
 * - Create new users (EMPLOYEE, MANAGER; CISO can also create CISO)
 * - Display role badges and creation dates
 *
 * Protected: Only CISO, MANAGER, and SYSTEM_ADMIN can access.
 *
 * @see app/api/users/route.ts - GET/POST endpoints
 * @see lib/errors/user.ts - Hebrew error messages
 */

import { redirect } from "next/navigation";
import { getAuthUser, hasRole, USER_MANAGER_ROLES } from "@/lib/auth/session";
import { UserManagementClient } from "@/components/users/UserManagementClient";

export default async function UsersPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login?callbackUrl=/users");
  }

  if (!hasRole(user, USER_MANAGER_ROLES)) {
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
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#1e293b",
              margin: 0,
            }}
            dir="rtl"
          >
            ניהול משתמשים
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#64748b",
              margin: "8px 0 0",
            }}
            dir="rtl"
          >
            {user.organizationName ?? "הארגון שלך"}
          </p>
        </header>

        <UserManagementClient
          currentUserRole={user.role}
          organizationId={user.organizationId}
        />
      </div>
    </main>
  );
}
