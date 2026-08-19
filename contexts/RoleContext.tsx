"use client";

/**
 * React Context for SYSTEM_ADMIN role impersonation.
 *
 * PURPOSE: Allows SYSTEM_ADMIN users to impersonate different roles
 * (EMPLOYEE, MANAGER, CISO) in the dashboard for testing and debugging.
 * Persists selection in localStorage.
 *
 * USAGE:
 * 1. App is wrapped with <RoleProvider> via providers.tsx
 * 2. Dashboard checks if user is SYSTEM_ADMIN
 * 3. If admin: uses this context for role (impersonation)
 * 4. If regular user: uses session role directly (ignores this context)
 *
 * NOTE: Regular users never see the RoleSwitcher. Their dashboard
 * is always based on their actual authenticated role.
 *
 * @see lib/test-users.ts - Impersonation user definitions
 * @see components/RoleSwitcher.tsx - Admin UI for switching roles
 * @see app/dashboard/page.tsx - Conditional impersonation logic
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { TEST_USERS, getTestUser, type TestUser } from "@/lib/test-users";

/** localStorage key for persisting selected role. */
const STORAGE_KEY = "mvp-test-role";

/** Default role when none is selected. */
const DEFAULT_ROLE_KEY = "employee";

/**
 * Shape of the role context value.
 */
type RoleContextValue = {
  /** Currently selected test user. */
  currentUser: TestUser;
  /** Key of the current role (employee, manager, ciso). */
  currentRoleKey: string;
  /** Switch to a different test role. */
  setRole: (roleKey: string) => void;
  /** Whether the context has loaded from localStorage. */
  isLoaded: boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

/**
 * Provider component that manages the current test role.
 *
 * Wraps the application and provides role context to all children.
 * Persists the selected role in localStorage for convenience.
 *
 * @param children - React children to wrap
 */
export function RoleProvider({ children }: { children: ReactNode }) {
  const [roleKey, setRoleKey] = useState<string>(DEFAULT_ROLE_KEY);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && TEST_USERS[stored]) {
      setRoleKey(stored);
    }
    setIsLoaded(true);
  }, []);

  const setRole = (newRoleKey: string) => {
    if (TEST_USERS[newRoleKey]) {
      setRoleKey(newRoleKey);
      localStorage.setItem(STORAGE_KEY, newRoleKey);
    }
  };

  const value: RoleContextValue = {
    currentUser: getTestUser(roleKey),
    currentRoleKey: roleKey,
    setRole,
    isLoaded,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

/**
 * Hook to access the current test role context.
 *
 * @returns Current user, role key, and setRole function
 * @throws Error if used outside of RoleProvider
 *
 * @example
 * ```tsx
 * const { currentUser, setRole } = useRole();
 * console.log(currentUser.role); // "EMPLOYEE" | "MANAGER" | "CISO"
 * setRole("ciso"); // Switch to CISO role
 * ```
 */
export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
