/**
 * Item API for a single AI Agent assessment request.
 *
 * - `PATCH /api/requests/:id` — apply a workflow action (primary)
 * - `PUT   /api/requests/:id` — same behavior as PATCH
 *
 * Body: `{ action: "APPROVE" | "REJECT" | "ROUTE_TO_MANAGER", reviewNotes?: string }`
 * Illegal transitions are rejected with HTTP 400 (enforced by `applyTransition`).
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import AgentRequest from "@/models/AgentRequest";
import {
  applyTransition,
  isRequestAction,
} from "@/lib/requests/transitions";
import type { RequestStatus } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type TransitionBody = {
  action?: unknown;
  reviewNotes?: string;
};

/**
 * Shared handler for PATCH and PUT: load request, apply transition, save.
 *
 * @returns Updated request, or 400 / 404 / 500 error payload
 */
async function updateRequestStatus(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body: TransitionBody = await req.json();

    if (!isRequestAction(body.action)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid or missing action. Allowed: APPROVE, REJECT, ROUTE_TO_MANAGER",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const request = await AgentRequest.findById(id);

    if (!request) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 },
      );
    }

    const result = applyTransition(
      request.status as RequestStatus,
      body.action,
    );

    if ("error" in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    request.status = result.status;
    request.assignedTo = result.assignedTo;

    if (typeof body.reviewNotes === "string") {
      request.reviewNotes = body.reviewNotes;
    }

    await request.save();

    return NextResponse.json({ success: true, request });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Apply a workflow action to a request (Approve, Reject, or Route to Manager).
 */
export async function PATCH(req: Request, context: RouteContext) {
  return updateRequestStatus(req, context);
}

/**
 * Alias of PATCH — same transition semantics.
 */
export async function PUT(req: Request, context: RouteContext) {
  return updateRequestStatus(req, context);
}
