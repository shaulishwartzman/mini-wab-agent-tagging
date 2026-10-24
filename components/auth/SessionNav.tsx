"use client";

/**
 * Session toolbar: current user, navigation links, and sign-out.
 *
 * Displays:
 * - Current user name and organization
 * - Admin panel link (SYSTEM_ADMIN only)
 * - User management link (CISO, MANAGER, SYSTEM_ADMIN)
 * - Sign-out button
 *
 * Shown on the dashboard so authenticated users can leave the page
 * (there is no global header yet). RoleSwitcher remains until cleanup.
 *
 * @see app/dashboard/page.tsx
 * @see app/admin/page.tsx - Admin panel
 * @see lib/auth/session.ts - USER_MANAGER_ROLES
 */

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { UserRole } from "@/lib/types";

const USER_MANAGER_ROLES: string[] = [
  UserRole.CISO,
  UserRole.MANAGER,
  UserRole.SYSTEM_ADMIN,
];

/**
 * Redesigned user bar with improved visual hierarchy.
 * 
 * Layout:
 * - Left: User name + org (prominent)
 * - Right: Action buttons + logout (color-coded)
 */
export function SessionNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        style={linkButtonStyle}
      >
        התחברות
      </Link>
    );
  }

  const isAdmin = session.user.role === UserRole.SYSTEM_ADMIN;
  const canManageUsers = USER_MANAGER_ROLES.includes(session.user.role);
  const isCiso = session.user.role === UserRole.CISO;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
      dir="rtl"
    >
      {/* User info - left side, prominent */}
      <span style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>
        {session.user.name}
        {session.user.organizationName
          ? ` · ${session.user.organizationName}`
          : isAdmin
            ? " · מנהל מערכת"
            : ""}
      </span>

      {/* Action buttons - right side */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {/* Green Path Settings - CISO only, green styling */}
        {isCiso && (
          <Link href="/green-path" style={greenPathButtonStyle}>
            הגדרות נתיב ירוק
          </Link>
        )}

        {/* User Management - CISO/Manager, blue */}
        {canManageUsers && !isAdmin && (
          <Link href="/users" style={linkButtonStyle}>
            ניהול משתמשים
          </Link>
        )}

        {/* Admin Panel - Admin only, purple */}
        {isAdmin && (
          <Link href="/admin" style={adminLinkStyle}>
            לוח בקרה
          </Link>
        )}

        {/* Logout - red, visually separated */}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={logoutButtonStyle}
        >
          התנתקות
        </button>
      </div>
    </div>
  );
}

const linkButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #3b82f6",
  backgroundColor: "#eff6ff",
  color: "#1e40af",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
};

const greenPathButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #22c55e",
  backgroundColor: "#f0fdf4",
  color: "#15803d",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
};

const adminLinkStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #7c3aed",
  backgroundColor: "#f5f3ff",
  color: "#7c3aed",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
};

const logoutButtonStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #ef4444",
  backgroundColor: "transparent",
  color: "#dc2626",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  marginLeft: 8,
};
