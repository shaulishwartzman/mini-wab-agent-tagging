/**
 * Hardcoded test users for MVP testing mode.
 *
 * PURPOSE: Allows testing the full approval workflow without a real
 * authentication system. Each user represents a different role in the
 * CISO-final approval workflow.
 *
 * NOTE: This is for MVP/demo purposes only. In production, this will be
 * replaced with proper authentication and user management.
 *
 * @see contexts/RoleContext.tsx - Uses these definitions
 * @see components/RoleSwitcher.tsx - UI for switching between users
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
 * - MANAGER: Can provide recommendations when consulted by CISO
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
    description: "Can recommend approval/rejection when consulted",
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
