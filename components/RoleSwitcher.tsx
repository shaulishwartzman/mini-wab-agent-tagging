"use client";

/**
 * Role switcher component for MVP testing mode.
 *
 * PURPOSE: Allows testers/developers to switch between different roles
 * (EMPLOYEE, MANAGER, CISO) to test the full approval workflow without
 * needing real authentication.
 *
 * FEATURES:
 * - Dropdown to select test user/role
 * - Visual indicator showing current role with colored badge
 * - "MVP Testing Mode" label for clarity
 * - Persists selection via RoleContext (localStorage)
 *
 * NOTE: This component is for MVP/demo purposes only. It will be removed
 * or replaced when proper authentication is implemented.
 *
 * @see contexts/RoleContext.tsx - Provides role state management
 * @see lib/test-users.ts - Test user definitions
 */

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
 * Displays current role and allows switching between test users.
 * Shows "MVP Testing Mode" indicator.
 */
export function RoleSwitcher() {
  const { currentUser, currentRoleKey, setRole, isLoaded } = useRole();
  const testUserEntries = Object.entries(TEST_USERS);

  if (!isLoaded) {
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
        backgroundColor: "#fef3c7",
        borderBottom: "2px solid #f59e0b",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* MVP Testing Mode Label */}
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
            color: "#92400e",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          MVP Testing Mode
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "#b45309",
          }}
        >
          (No authentication required)
        </span>
      </div>

      {/* Divider */}
      <div
        style={{
          width: "1px",
          height: "24px",
          backgroundColor: "#f59e0b",
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
            color: "#78350f",
          }}
        >
          Viewing as:
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
          color: "#78350f",
          fontStyle: "italic",
        }}
      >
        {currentUser.description}
      </div>
    </div>
  );
}
