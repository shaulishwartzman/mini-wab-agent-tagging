/**
 * Server-side session helpers for NextAuth.
 *
 * PURPOSE: Thin wrappers around `getServerSession` so API routes and Server
 * Components share one import path and always use `authOptions`.
 *
 * Client components should use `useSession()` from `next-auth/react` instead
 * (requires SessionProvider in `app/providers.tsx`).
 *
 * @see lib/auth/auth-options.ts - Shared NextAuth configuration
 */

import { getServerSession } from "next-auth";
import { authOptions, type SessionUser } from "@/lib/auth/auth-options";
import { UserRole, type UserRole as UserRoleType } from "@/lib/types";

/**
 * Get the current NextAuth session on the server.
 *
 * @returns Session object or null if unauthenticated
 */
export async function getAuthSession() {
  return getServerSession(authOptions);
}

/**
 * Get the authenticated user from the session, or null.
 *
 * @returns SessionUser when signed in, otherwise null
 */
export async function getAuthUser(): Promise<SessionUser | null> {
  const session = await getAuthSession();
  return session?.user ?? null;
}

/**
 * Require an authenticated user; throws if missing.
 * Useful in API route handlers that should return 401.
 *
 * @returns Authenticated SessionUser
 * @throws Error with message "UNAUTHORIZED" when no session
 */
export async function requireAuthUser(): Promise<SessionUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Check whether a session user has one of the allowed roles.
 *
 * @param user - Authenticated session user
 * @param allowedRoles - Roles that may proceed
 * @returns true if user's role is in the allow-list
 */
export function hasRole(
  user: SessionUser,
  allowedRoles: readonly UserRoleType[],
): boolean {
  return allowedRoles.includes(user.role as UserRoleType);
}

/**
 * Roles allowed to manage org users (create / list).
 */
export const USER_MANAGER_ROLES = [
  UserRole.CISO,
  UserRole.MANAGER,
  UserRole.SYSTEM_ADMIN,
] as const;
