/**
 * Client-side API helpers for agent assessment requests.
 *
 * These functions wrap fetch calls to /api/requests for use in React
 * components. They handle JSON serialization and return typed responses.
 */

import type {
  AgentAssessmentPayload,
  AgentRequestResponse,
} from "@/lib/types";

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
 * Fetch all agent assessment requests from MongoDB, newest first.
 *
 * @returns { success, requests } on success, { success: false, error } on fail
 */
export async function fetchRequests(): Promise<FetchRequestsResult> {
  try {
    const res = await fetch("/api/requests");
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
