"use client";

/**
 * Client-side providers wrapper for the application.
 *
 * PROVIDERS:
 * - SessionProvider: NextAuth client session (`useSession`)
 * - RoleProvider: Admin role impersonation (SYSTEM_ADMIN only)
 *
 * The RoleProvider allows SYSTEM_ADMIN users to impersonate different roles
 * (EMPLOYEE, MANAGER, CISO) in the dashboard for testing and debugging.
 * Regular users always see their dashboard based on their actual session role.
 *
 * @see lib/auth/auth-options.ts - Server/session configuration
 * @see contexts/RoleContext.tsx - Admin impersonation context
 * @see components/RoleSwitcher.tsx - Admin role switcher UI
 */

import { SessionProvider } from "next-auth/react";
import { RoleProvider } from "@/contexts/RoleContext";
import type { ReactNode } from "react";

/**
 * Root providers wrapper component.
 *
 * Wraps the application with:
 * 1. SessionProvider - NextAuth session management
 * 2. RoleProvider - Admin role impersonation feature
 *
 * @param children - Application content to wrap
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <RoleProvider>{children}</RoleProvider>
    </SessionProvider>
  );
}
