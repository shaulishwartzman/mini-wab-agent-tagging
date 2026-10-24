/**
 * Server-side request lifecycle state machine (CISO-final workflow).
 *
 * CISO is the final decision-maker. Managers provide recommendations only.
 *
 * Legal transitions:
 * - PENDING_CISO + APPROVE            → APPROVED (terminal)
 * - PENDING_CISO + REJECT             → REJECTED (terminal)
 * - PENDING_CISO + ROUTE_TO_MANAGER   → PENDING_MANAGER (assignedTo MANAGER)
 * - PENDING_MANAGER + RECOMMEND_APPROVE → PENDING_CISO (back to CISO with recommendation)
 * - PENDING_MANAGER + RECOMMEND_REJECT  → PENDING_CISO (back to CISO with recommendation)
 *
 * Terminal statuses (APPROVED, REJECTED, AUTO_APPROVED) accept no further actions.
 */

import {
  RequestAction,
  RequestStatus,
  UserRole,
  type RequestAction as RequestActionType,
  type RequestStatus as RequestStatusType,
  type UserRole as UserRoleType,
} from "@/lib/types";

/** Successful transition: next status and role inbox (or null if terminal). */
export type TransitionResult = {
  status: RequestStatusType;
  assignedTo: UserRoleType | null;
};

/** Failed transition (illegal action for current status). */
export type TransitionError = {
  error: string;
};

const TRANSITIONS: Record<
  string,
  Partial<Record<RequestActionType, TransitionResult>>
> = {
  [RequestStatus.PENDING_CISO]: {
    [RequestAction.APPROVE]: {
      status: RequestStatus.APPROVED,
      assignedTo: null,
    },
    [RequestAction.REJECT]: {
      status: RequestStatus.REJECTED,
      assignedTo: null,
    },
    [RequestAction.ROUTE_TO_MANAGER]: {
      status: RequestStatus.PENDING_MANAGER,
      assignedTo: UserRole.MANAGER,
    },
  },
  [RequestStatus.PENDING_MANAGER]: {
    [RequestAction.RECOMMEND_APPROVE]: {
      status: RequestStatus.PENDING_CISO,
      assignedTo: UserRole.CISO,
    },
    [RequestAction.RECOMMEND_REJECT]: {
      status: RequestStatus.PENDING_CISO,
      assignedTo: UserRole.CISO,
    },
  },
};

/**
 * Computes the next `status` and `assignedTo` for a request.
 *
 * @param currentStatus - Current request status in MongoDB
 * @param action - Requested action (CISO: APPROVE, REJECT, ROUTE_TO_MANAGER; Manager: RECOMMEND_APPROVE, RECOMMEND_REJECT)
 * @returns Next workflow fields, or `{ error }` if the transition is illegal
 */
export function applyTransition(
  currentStatus: RequestStatusType,
  action: RequestActionType,
): TransitionResult | TransitionError {
  const next = TRANSITIONS[currentStatus]?.[action];

  if (!next) {
    return {
      error: `Illegal transition: cannot apply ${action} when status is ${currentStatus}`,
    };
  }

  return next;
}

/**
 * Type guard: whether a value is a valid `RequestAction`.
 */
export function isRequestAction(value: unknown): value is RequestActionType {
  return (
    typeof value === "string" &&
    Object.values(RequestAction).includes(value as RequestActionType)
  );
}

/**
 * Type guard: whether a value is a valid `UserRole`.
 */
export function isValidUserRole(value: unknown): value is UserRoleType {
  return (
    typeof value === "string" &&
    Object.values(UserRole).includes(value as UserRoleType)
  );
}

/**
 * Role-based permissions for workflow actions.
 *
 * - CISO: Can approve, reject, or route to manager
 * - MANAGER: Can only recommend (approve/reject) when consulted
 * - EMPLOYEE: Cannot perform any workflow actions (submit only)
 * - SYSTEM_ADMIN: No request-workflow actions (org maintenance only)
 */
const ROLE_PERMISSIONS: Record<UserRoleType, RequestActionType[]> = {
  [UserRole.CISO]: [
    RequestAction.APPROVE,
    RequestAction.REJECT,
    RequestAction.ROUTE_TO_MANAGER,
  ],
  [UserRole.MANAGER]: [
    RequestAction.RECOMMEND_APPROVE,
    RequestAction.RECOMMEND_REJECT,
  ],
  [UserRole.EMPLOYEE]: [],
  [UserRole.SYSTEM_ADMIN]: [],
};

/**
 * Checks if a role is authorized to perform an action.
 *
 * @param actorRole - The role of the user attempting the action
 * @param action - The action being attempted
 * @returns true if the role can perform the action, false otherwise
 *
 * @example
 * isAuthorizedForAction("CISO", "APPROVE")           // true
 * isAuthorizedForAction("MANAGER", "APPROVE")        // false
 * isAuthorizedForAction("MANAGER", "RECOMMEND_APPROVE") // true
 * isAuthorizedForAction("EMPLOYEE", "APPROVE")       // false
 */
export function isAuthorizedForAction(
  actorRole: UserRoleType,
  action: RequestActionType,
): boolean {
  return ROLE_PERMISSIONS[actorRole]?.includes(action) ?? false;
}

/**
 * Gets the list of allowed actions for a given role.
 * Useful for UI to show/hide action buttons.
 *
 * @param role - The user's role
 * @returns Array of actions the role can perform
 */
export function getAllowedActionsForRole(role: UserRoleType): RequestActionType[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
