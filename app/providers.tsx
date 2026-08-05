"use client";

/**
 * Client-side providers wrapper for the application.
 *
 * PURPOSE: Wraps client-side context providers that need to be at the
 * root of the application. This is a client component that can be
 * imported into the server-side layout.tsx.
 *
 * PROVIDERS INCLUDED:
 * - RoleProvider: MVP testing role management (test user selection)
 *
 * NOTE: When real authentication is added, this file will be updated
 * to include auth providers instead of the MVP test role provider.
 *
 * @see contexts/RoleContext.tsx - Role provider implementation
 */

import { RoleProvider } from "@/contexts/RoleContext";
import type { ReactNode } from "react";

/**
 * Root providers wrapper component.
 *
 * @param children - Application content to wrap
 */
export function Providers({ children }: { children: ReactNode }) {
  return <RoleProvider>{children}</RoleProvider>;
}
