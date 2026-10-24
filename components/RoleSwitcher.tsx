"use client";

/**
 * Role switcher component for SYSTEM_ADMIN testing mode.
 *
 * PURPOSE: Allows system administrators to impersonate different roles
 * (EMPLOYEE, MANAGER, CISO) to test the approval workflow without
 * needing to log in as different users.
 *
 * FEATURES:
 * - Only visible to authenticated SYSTEM_ADMIN users
 * - Dropdown to select test user/role
 * - Visual indicator showing current impersonated role
 * - "Admin Testing Mode" label for clarity
 * - Persists selection via RoleContext (localStorage)
 *
 * NOTE: Regular users (EMPLOYEE, MANAGER, CISO) see the dashboard
 * based on their actual session role, without this switcher.
 *
 * @see contexts/RoleContext.tsx - Provides role state management
 * @see lib/test-users.ts - Test user definitions
 * @see app/dashboard/page.tsx - Uses this for admin impersonation
 */

import { useSession } from "next-auth/react";
import { useRole } from "@/contexts/RoleContext";
import { TEST_USERS } from "@/lib/test-users";
import { UserRole } from "@/lib/types";

/** Color scheme for role badges. */
const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  [UserRole.EMPLOYEE]: {
    bg: "#dbeafe",
    text: "#1e40af",
    border: "#93c5fd",
  },
  [UserRole.MANAGER]: {
    bg: "#fef3c7",
    text: "#92400e",
    border: "#fcd34d",
  },
  [UserRole.CISO]: {
    bg: "#dcfce7",
    text: "#166534",
    border: "#86efac",
  },
};

/**
 * Role switcher dropdown component.
 *
 * Only renders for SYSTEM_ADMIN users. Allows impersonation of
 * different roles for testing the approval workflow.
 *
 * @returns Role switcher UI for admins, null for other users
 */
export function RoleSwitcher() {
  const { data: session, status } = useSession();
  const { currentUser, currentRoleKey, setRole, isLoaded } = useRole();
  const testUserEntries = Object.entries(TEST_USERS);

  // Only show for authenticated SYSTEM_ADMIN users
  if (status === "loading" || !isLoaded) {
    return null;
  }

  // Hide for non-admin users
  if (!session?.user || session.user.role !== UserRole.SYSTEM_ADMIN) {
    return null;
  }

  const roleColor = ROLE_COLORS[currentUser.role] ?? ROLE_COLORS[UserRole.EMPLOYEE];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "12px 20px",
        backgroundColor: "#f5f3ff",
        borderBottom: "2px solid #7c3aed",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Admin Testing Mode Label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#5b21b6",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Admin Testing Mode
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "#7c3aed",
          }}
        >
          (Impersonating role)
        </span>
      </div>

      {/* Divider */}
      <div
        style={{
          width: "1px",
          height: "24px",
          backgroundColor: "#7c3aed",
        }}
      />

      {/* Role Selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <label
          htmlFor="role-select"
          style={{
            fontSize: "13px",
            fontWeight: "500",
            color: "#5b21b6",
          }}
        >
          View as:
        </label>

        <select
          id="role-select"
          value={currentRoleKey}
          onChange={(e) => setRole(e.target.value)}
          style={{
            padding: "6px 12px",
            fontSize: "13px",
            fontWeight: "500",
            borderRadius: "6px",
            border: `1px solid ${roleColor.border}`,
            backgroundColor: roleColor.bg,
            color: roleColor.text,
            cursor: "pointer",
            outline: "none",
          }}
        >
          {testUserEntries.map(([key, user]) => (
            <option key={key} value={key}>
              {user.name} ({user.role})
            </option>
          ))}
        </select>

        {/* Current Role Badge */}
        <span
          style={{
            padding: "4px 10px",
            fontSize: "11px",
            fontWeight: "600",
            borderRadius: "9999px",
            backgroundColor: roleColor.bg,
            color: roleColor.text,
            border: `1px solid ${roleColor.border}`,
            textTransform: "uppercase",
          }}
        >
          {currentUser.role}
        </span>
      </div>

      {/* Role Description */}
      <div
        style={{
          marginLeft: "auto",
          fontSize: "12px",
          color: "#5b21b6",
          fontStyle: "italic",
        }}
      >
        {currentUser.description}
      </div>
    </div>
  );
}

