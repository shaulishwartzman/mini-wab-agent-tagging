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
