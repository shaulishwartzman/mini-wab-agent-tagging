/**
 * Impersonation user definitions for SYSTEM_ADMIN testing.
 *
 * PURPOSE: Allows SYSTEM_ADMIN users to impersonate different roles
 * (EMPLOYEE, MANAGER, CISO) in the dashboard for testing and debugging
 * the approval workflow.
 *
 * Each entry represents a role that can be impersonated:
 * - EMPLOYEE: Can submit agent assessment requests
 * - MANAGER: Can submit requests and recommend when consulted
 * - CISO: Final decision-maker for all requests
 *
 * NOTE: Only SYSTEM_ADMIN users can use this feature. Regular users
 * always see their dashboard based on their actual authenticated role.
 *
 * @see contexts/RoleContext.tsx - Admin impersonation context
 * @see components/RoleSwitcher.tsx - Admin UI for role switching
 */

import { UserRole } from "@/lib/types";

/**
 * Shape of a test user for MVP testing.
 */
export type TestUser = {
  /** Unique identifier (email format for consistency with future auth). */
  id: string;
  /** Role in the approval workflow. */
  role: (typeof UserRole)[keyof typeof UserRole];
  /** Display name for UI. */
  name: string;
  /** Brief description of what this role can do. */
  description: string;
};

/**
 * Predefined test users for MVP testing.
 *
 * - EMPLOYEE: Can submit agent assessment requests
 * - MANAGER: Can submit requests; can recommend when consulted by CISO
 * - CISO: Final decision-maker; can approve, reject, or route to manager
 */
export const TEST_USERS: Record<string, TestUser> = {
  employee: {
    id: "employee@test.local",
    role: UserRole.EMPLOYEE,
    name: "Test Employee",
    description: "Can submit agent assessment requests",
  },
  manager: {
    id: "manager@test.local",
    role: UserRole.MANAGER,
    name: "Test Manager",
    description: "Can submit requests and recommend when consulted",
  },
  ciso: {
    id: "ciso@test.local",
    role: UserRole.CISO,
    name: "Test CISO",
    description: "Final decision-maker for all requests",
  },
};

/**
 * Get a test user by role key.
 *
 * @param roleKey - Key from TEST_USERS (employee, manager, ciso)
 * @returns The test user, or employee as default
 */
export function getTestUser(roleKey: string): TestUser {
  return TEST_USERS[roleKey] ?? TEST_USERS.employee;
}

/**
 * Get all test users as an array for rendering in UI.
 */
export function getAllTestUsers(): TestUser[] {
  return Object.values(TEST_USERS);
}
