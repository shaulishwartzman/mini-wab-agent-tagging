/**
 * Client-side API helpers for agent assessment requests.
 *
 * These functions wrap fetch calls to /api/requests for use in React
 * components. They handle JSON serialization and return typed responses.
 *
 * FUNCTIONS:
 * - createRequest() - Create a new assessment request
 * - fetchRequests() - List requests with optional filters
 * - deleteRequest() - Remove a request by ID
 * - applyAction() - Apply workflow action (approve, reject, route, recommend)
 *
 * @see app/api/requests/route.ts - POST/GET endpoints
 * @see app/api/requests/[id]/route.ts - PATCH/DELETE endpoints
 * @see lib/errors/authorization.ts - Hebrew messages for 403 unauthorized
 */

import type {
  AgentAssessmentPayload,
  AgentRequestResponse,
  RequestAction,
  UserRole,
} from "@/lib/types";
import { getAuthorizationErrorInfo } from "@/lib/errors/authorization";

export type { AgentRequestResponse };

/** Response shape for create/update operations. */
export type CreateRequestResult = {
  success: boolean;
  request?: AgentRequestResponse;
  error?: string;
};

/** Response shape for list operations. */
export type FetchRequestsResult = {
  success: boolean;
  requests?: AgentRequestResponse[];
  error?: string;
};

/**
 * Create a new agent assessment request in MongoDB.
 *
 * @param payload - Assessment data (agentName required, rest optional)
 * @returns { success, request } on success, { success: false, error } on fail
 */
export async function createRequest(
  payload: AgentAssessmentPayload
): Promise<CreateRequestResult> {
  try {
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch {
    return { success: false, error: "Network error" };
  }
}

/**
 * Options for filtering requests.
 */
export type FetchRequestsOptions = {
  /** Filter by role inbox (EMPLOYEE, MANAGER, CISO). */
  assignedTo?: (typeof UserRole)[keyof typeof UserRole];
  /** Filter by status. */
  status?: (typeof RequestAction)[keyof typeof RequestAction];
};

/**
 * Fetch agent assessment requests from MongoDB, newest first.
 *
 * @param options - Optional filters (assignedTo, status)
 * @returns { success, requests } on success, { success: false, error } on fail
 *
 * @example
 * ```ts
 * // Fetch all requests
 * const all = await fetchRequests();
 *
 * // Fetch only CISO inbox
 * const cisoInbox = await fetchRequests({ assignedTo: "CISO" });
 * ```
 */
export async function fetchRequests(
  options?: FetchRequestsOptions
): Promise<FetchRequestsResult> {
  try {
    const params = new URLSearchParams();
    if (options?.assignedTo) {
      params.set("assignedTo", options.assignedTo);
    }
    if (options?.status) {
      params.set("status", options.status);
    }
    const query = params.toString();
    const url = query ? `/api/requests?${query}` : "/api/requests";
    const res = await fetch(url);
    return await res.json();
  } catch {
    return { success: false, error: "Network error" };
  }
}

/**
 * Delete an agent assessment request by ID.
 *
 * @param id - The MongoDB _id of the request to delete
 * @returns { success } on success, { success: false, error } on fail
 */
export async function deleteRequest(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/requests/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch {
    return { success: false, error: "Network error" };
  }
}

/**
 * Options for workflow actions.
 */
export type ApplyActionOptions = {
  /** Optional note from the reviewer. */
  reviewNotes?: string;
  /** Target user ID when routing to manager. */
  targetUserId?: string;
};

/**
 * Extended result type for workflow actions that includes authorization info.
 * User-facing Hebrew messages come from `lib/errors/authorization.ts`.
 */
export type ApplyActionResult = CreateRequestResult & {
  /** True if the error was due to unauthorized role. */
  unauthorized?: boolean;
  /** User-friendly Hebrew message for display. */
  userMessage?: string;
  /** Suggested redirect path if user should navigate elsewhere. */
  redirectTo?: string;
};

/**
 * Apply a workflow action to a request (approve, reject, route, recommend).
 *
 * This is the main function for driving the approval workflow. Actions are:
 * - CISO: APPROVE, REJECT, ROUTE_TO_MANAGER
 * - Manager: RECOMMEND_APPROVE, RECOMMEND_REJECT
 *
 * Authorization is enforced by the server. On HTTP 403, messages are resolved
 * via `getAuthorizationErrorInfo()` from `lib/errors/authorization.ts`.
 *
 * @param id - The MongoDB _id of the request
 * @param action - The action to apply (from RequestAction enum)
 * @param actorRole - Role of the user (CISO, MANAGER, EMPLOYEE)
 * @param actorUserId - Who is performing this action (for audit trail)
 * @param options - Optional reviewNotes and targetUserId
 * @returns { success, request } on success, { success: false, error, unauthorized, userMessage } on fail
 *
 * @example
 * ```ts
 * const result = await applyAction(requestId, "APPROVE", "CISO", "ciso@test.local", {
 *   reviewNotes: "Looks good, approved."
 * });
 *
 * if (!result.success && result.unauthorized) {
 *   alert(result.userMessage);
 *   if (result.redirectTo) router.push(result.redirectTo);
 * }
 * ```
 */
export async function applyAction(
  id: string,
  action: (typeof RequestAction)[keyof typeof RequestAction],
  actorRole: (typeof UserRole)[keyof typeof UserRole],
  actorUserId: string,
  options?: ApplyActionOptions
): Promise<ApplyActionResult> {
  try {
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        actorRole,
        actorUserId,
        reviewNotes: options?.reviewNotes,
        targetUserId: options?.targetUserId,
      }),
    });

    const data = await res.json();

    // Handle 403 Forbidden (unauthorized role)
    if (res.status === 403) {
      const errorInfo = getAuthorizationErrorInfo(actorRole, action);
      return {
        ...data,
        unauthorized: true,
        userMessage: errorInfo.userMessage,
        redirectTo: errorInfo.redirectTo,
      };
    }

    return data;
  } catch {
    return { success: false, error: "Network error" };
  }
}
