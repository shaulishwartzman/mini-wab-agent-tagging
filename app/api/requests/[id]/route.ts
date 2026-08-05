/**
 * Item API for a single AI Agent assessment request.
 *
 * - `PATCH  /api/requests/:id` — apply a workflow action (primary)
 * - `PUT    /api/requests/:id` — same behavior as PATCH
 * - `DELETE /api/requests/:id` — remove a request by ID
 *
 * PATCH/PUT Body:
 * - CISO actions: APPROVE, REJECT, ROUTE_TO_MANAGER
 * - Manager actions: RECOMMEND_APPROVE, RECOMMEND_REJECT
 *
 * Additional fields: reviewNotes, actorUserId, targetUserId (for routing)
 * Illegal transitions are rejected with HTTP 400 (enforced by `applyTransition`).
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import AgentRequest from "@/models/AgentRequest";
import {
  applyTransition,
  isRequestAction,
} from "@/lib/requests/transitions";
import { RequestAction, RequestStatus, UserRole, type ManagerRecommendation } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type TransitionBody = {
  action?: unknown;
  reviewNotes?: string;
  actorUserId?: string;
  targetUserId?: string;
};

/**
 * Shared handler for PATCH and PUT: load request, apply transition, save.
 * Handles audit fields: approvedBy, resolvedAt, managerRecommendation, routingHistory.
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
            "Invalid or missing action. Allowed: APPROVE, REJECT, ROUTE_TO_MANAGER, RECOMMEND_APPROVE, RECOMMEND_REJECT",
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

    const previousStatus = request.status;
    const previousAssignedToUserId = request.assignedToUserId;

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

    const isTerminal = result.status === RequestStatus.APPROVED || result.status === RequestStatus.REJECTED;
    const actorUserId = body.actorUserId || "unknown";
    const actorRole = previousStatus === RequestStatus.PENDING_MANAGER ? UserRole.MANAGER : UserRole.CISO;

    if (isTerminal) {
      request.approvedBy = actorUserId;
      request.resolvedAt = new Date();
    }

    if (body.action === RequestAction.ROUTE_TO_MANAGER) {
      request.assignedToUserId = body.targetUserId || null;

      request.routingHistory.push({
        from: actorUserId,
        fromRole: UserRole.CISO,
        to: body.targetUserId || "unassigned",
        toRole: UserRole.MANAGER,
        action: body.action,
        notes: body.reviewNotes || "",
        at: new Date(),
      });
    }

    if (body.action === RequestAction.RECOMMEND_APPROVE || body.action === RequestAction.RECOMMEND_REJECT) {
      request.managerRecommendation = body.action as ManagerRecommendation;
      request.assignedToUserId = null;

      request.routingHistory.push({
        from: actorUserId,
        fromRole: UserRole.MANAGER,
        to: previousAssignedToUserId || "ciso",
        toRole: UserRole.CISO,
        action: body.action,
        notes: body.reviewNotes || "",
        at: new Date(),
      });
    }

    if (isTerminal && actorRole === UserRole.CISO) {
      request.routingHistory.push({
        from: actorUserId,
        fromRole: UserRole.CISO,
        to: "terminal",
        toRole: UserRole.CISO,
        action: body.action,
        notes: body.reviewNotes || "",
        at: new Date(),
      });
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
 * Apply a workflow action to a request.
 * CISO: APPROVE, REJECT, ROUTE_TO_MANAGER
 * Manager: RECOMMEND_APPROVE, RECOMMEND_REJECT
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

/**
 * Delete a request by ID.
 *
 * @returns `{ success: true }` or 404 / 500 error payload
 */
export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    await connectDB();

    const deleted = await AgentRequest.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
