/**
 * User-facing authorization error messages for the request workflow.
 *
 * PURPOSE: Centralizes Hebrew messages and optional redirect paths shown when
 * a user attempts an action their role cannot perform (HTTP 403).
 *
 * Used by `applyAction()` in `lib/api/requests.ts` when the API returns 403.
 * Keep messages user-facing (no internal jargon). Add new cases here as roles/actions grow.
 *
 * @see lib/requests/transitions.ts - `isAuthorizedForAction()` (server-side check)
 * @see lib/api/requests.ts - client helper that surfaces these messages
 */

import {
  RequestAction,
  UserRole,
  type RequestAction as RequestActionType,
  type UserRole as UserRoleType,
} from "@/lib/types";

/**
 * Shape returned for UI display after an authorization failure.
 */
export type AuthorizationErrorInfo = {
  /** Hebrew message suitable for alert / toast / banner. */
  userMessage: string;
  /** Optional path to navigate the user to (e.g. home for employees). */
  redirectTo?: string;
};

/**
 * Lookup key: `${role}:${action}` or `${role}:*` for role-wide defaults.
 */
type AuthErrorKey = `${UserRoleType}:${RequestActionType | "*"}`;

/**
 * Modular message table — add or edit cases without changing call-site logic.
 *
 * Keys:
 * - `ROLE:*` — any unauthorized action for that role (fallback for the role)
 * - `ROLE:ACTION` — specific role + action pair (takes priority)
 */
const AUTHORIZATION_ERRORS: Partial<Record<AuthErrorKey, AuthorizationErrorInfo>> = {
  // Employee — no workflow actions; send them back to the form/home
  [`${UserRole.EMPLOYEE}:*`]: {
    userMessage:
      "אין לך הרשאה לבצע פעולות על בקשות. רק CISO ומנהלים מורשים יכולים לאשר או לדחות.",
    redirectTo: "/",
  },

  // Manager — recommend only
  [`${UserRole.MANAGER}:${RequestAction.APPROVE}`]: {
    userMessage:
      "מנהלים יכולים רק להמליץ, לא לאשר או לדחות. השתמש ב״המלץ לאישור״ או ״המלץ לדחייה״.",
  },
  [`${UserRole.MANAGER}:${RequestAction.REJECT}`]: {
    userMessage:
      "מנהלים יכולים רק להמליץ, לא לאשר או לדחות. השתמש ב״המלץ לאישור״ או ״המלץ לדחייה״.",
  },
  [`${UserRole.MANAGER}:${RequestAction.ROUTE_TO_MANAGER}`]: {
    userMessage: "רק CISO יכול להעביר בקשות למנהלים.",
  },

  // CISO — final decision maker, not recommend
  [`${UserRole.CISO}:${RequestAction.RECOMMEND_APPROVE}`]: {
    userMessage:
      "CISO לא צריך להמליץ - יש לך הרשאה לאשר או לדחות ישירות.",
  },
  [`${UserRole.CISO}:${RequestAction.RECOMMEND_REJECT}`]: {
    userMessage:
      "CISO לא צריך להמליץ - יש לך הרשאה לאשר או לדחות ישירות.",
  },
};

/** Fallback when no role/action-specific message exists. */
const DEFAULT_AUTHORIZATION_ERROR: AuthorizationErrorInfo = {
  userMessage: "אין לך הרשאה לבצע פעולה זו.",
};

/**
 * Resolve a user-facing authorization error for a failed role/action attempt.
 *
 * Lookup order:
 * 1. Exact match: `ROLE:ACTION`
 * 2. Role default: `ROLE:*`
 * 3. Global default
 *
 * @param actorRole - Role of the user who attempted the action
 * @param action - Action that was denied
 * @returns Hebrew message and optional redirect path
 *
 * @example
 * getAuthorizationErrorInfo("MANAGER", "APPROVE")
 * // → { userMessage: "מנהלים יכולים רק להמליץ..." }
 *
 * getAuthorizationErrorInfo("EMPLOYEE", "REJECT")
 * // → { userMessage: "...", redirectTo: "/" }
 */
export function getAuthorizationErrorInfo(
  actorRole: UserRoleType | string,
  action: RequestActionType | string,
): AuthorizationErrorInfo {
  const specificKey = `${actorRole}:${action}` as AuthErrorKey;
  const roleDefaultKey = `${actorRole}:*` as AuthErrorKey;

  return (
    AUTHORIZATION_ERRORS[specificKey] ??
    AUTHORIZATION_ERRORS[roleDefaultKey] ??
    DEFAULT_AUTHORIZATION_ERROR
  );
}
