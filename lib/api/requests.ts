/**
 * Client-side API helpers for agent assessment requests.
 *
 * These functions wrap fetch calls to /api/requests for use in React
 * components. They handle JSON serialization and return typed responses.
 *
 * FUNCTIONS:
 * - createRequest() - Create a new assessment request
 * - fetchRequests() - List requests with filters and pagination
 * - deleteRequest() - Remove a request by ID
 * - applyAction() - Apply workflow action (approve, reject, route, recommend)
 *
 * TYPES:
 * - PaginationInfo - Pagination metadata (page, limit, total, totalPages)
 * - FetchRequestsOptions - Filter and pagination options
 * - FetchRequestsResult - Response with requests array and pagination
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

/** Pagination metadata returned by list operations. */
export type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Response shape for list operations with pagination. */
export type FetchRequestsResult = {
  success: boolean;
  requests?: AgentRequestResponse[];
  pagination?: PaginationInfo;
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
 * Options for filtering and paginating requests.
 *
 * `status` accepts a single status string or an array (joined as comma-separated
 * for the API `$in` query). Use an array for CISO "active requests" views.
 */
export type FetchRequestsOptions = {
  /** Filter by role inbox (MANAGER, CISO). */
  assignedTo?: (typeof UserRole)[keyof typeof UserRole];
  /** Filter by specific user assignment (for manager routing). */
  assignedToUserId?: string;
  /** Filter by who submitted the request (for "my requests" view). */
  submittedByUserId?: string;
  /** Filter by one status, or several (OR / `$in`). */
  status?: string | string[];
  /** Page number (default 1). */
  page?: number;
  /** Items per page (default 10, max 50). */
  limit?: number;
};

/**
 * Fetch agent assessment requests from MongoDB with filtering and pagination.
 *
 * @param options - Filters and pagination (all optional)
 * @returns { success, requests, pagination } on success, { success: false, error } on fail
 *
 * @example
 * ```ts
 * // CISO inbox — needs action now
 * const mine = await fetchRequests({ assignedTo: "CISO" });
 *
 * // Active / open pipeline (pending CISO or manager)
 * const active = await fetchRequests({
 *   status: ["PENDING_CISO", "PENDING_MANAGER"],
 * });
 *
 * // Auto-approved rollup
 * const green = await fetchRequests({ status: "AUTO_APPROVED" });
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
    if (options?.assignedToUserId) {
      params.set("assignedToUserId", options.assignedToUserId);
    }
    if (options?.submittedByUserId) {
      params.set("submittedByUserId", options.submittedByUserId);
    }
    if (options?.status) {
      const statusValue = Array.isArray(options.status)
        ? options.status.join(",")
        : options.status;
      params.set("status", statusValue);
    }
    if (options?.page) {
      params.set("page", String(options.page));
    }
    if (options?.limit) {
      params.set("limit", String(options.limit));
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
