/**
 * Role permission helpers for user creation.
 *
 * PURPOSE: Shared logic for both server (API routes) and client (UI)
 * without importing Mongoose or other server-only modules.
 *
 * @see lib/auth/auth-options.ts - Server-side NextAuth config (imports this)
 * @see components/users/UserManagementClient.tsx - Client UI (imports this)
 * @see app/api/users/route.ts - API route (imports this)
 */

import { UserRole, OrgBoundRoles, type OrgBoundRole } from "@/lib/types";

/**
 * Check whether a role may create any org users.
 *
 * @param role - Role of the actor
 * @returns true if the role can create org-bound users
 */
export function canCreateUsers(role: string): boolean {
  return (
    role === UserRole.CISO ||
    role === UserRole.MANAGER ||
    role === UserRole.SYSTEM_ADMIN
  );
}

/**
 * Check whether a creator role may create a specific target role.
 * SYSTEM_ADMIN cannot be created through this path (seed/ops only).
 *
 * @param creatorRole - Role of the user creating
 * @param targetRole - Role being created
 * @returns true if allowed
 */
export function canCreateRole(creatorRole: string, targetRole: string): boolean {
  if (!OrgBoundRoles.includes(targetRole as OrgBoundRole)) {
    return false;
  }

  // SYSTEM_ADMIN and CISO can create EMPLOYEE, MANAGER, CISO
  if (
    creatorRole === UserRole.SYSTEM_ADMIN ||
    creatorRole === UserRole.CISO
  ) {
    return true;
  }

  // MANAGER can create EMPLOYEE and MANAGER (not CISO)
  if (creatorRole === UserRole.MANAGER) {
    return targetRole === UserRole.EMPLOYEE || targetRole === UserRole.MANAGER;
  }

  return false;
}
