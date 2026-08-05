/**
 * Collection API for AI Agent assessment requests.
 *
 * - `POST /api/requests` — create a new request in MongoDB
 * - `GET  /api/requests` — list requests (optional role/status filters)
 *
 * Responses follow `{ success: true | false, ... }`.
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import AgentRequest from "@/models/AgentRequest";
import {
  RequestStatus,
  UserRole,
  type AgentAssessmentPayload,
  type RequestStatus as RequestStatusType,
  type UserRole as UserRoleType,
} from "@/lib/types";

/** POST body: assessment fields plus optional workflow overrides. */
type CreateRequestBody = AgentAssessmentPayload & {
  /** When true, creates the request as AUTO_APPROVED (no inbox assignment). */
  autoApprove?: boolean;
  submittedByRole?: UserRoleType;
  reviewNotes?: string;
};

/** @returns Whether `value` is a known UserRole. */
function isUserRole(value: string): value is UserRoleType {
  return Object.values(UserRole).includes(value as UserRoleType);
}

/** @returns Whether `value` is a known RequestStatus. */
function isRequestStatus(value: string): value is RequestStatusType {
  return Object.values(RequestStatus).includes(value as RequestStatusType);
}

/**
 * Create a new agent assessment request.
 *
 * Body must include at least `agentName`. Defaults to `PENDING_CISO` / `assignedTo: CISO`.
 * Pass `autoApprove: true` to create as `AUTO_APPROVED` with no assignee.
 *
 * New fields: submittedByUserId, agentPurpose, autoApprovalEligible, autoApprovalReason
 *
 * @returns `201` + `{ success, request }` or `400` / `500` error payload
 */
export async function POST(req: Request) {
  try {
    const body: CreateRequestBody = await req.json();

    if (!body.agentName || typeof body.agentName !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing agentName" },
        { status: 400 },
      );
    }

    await connectDB();

    const autoApprove = body.autoApprove === true;

    const request = await AgentRequest.create({
      agentName: body.agentName.trim(),
      answers: body.answers ?? {},
      classification: body.classification ?? {},
      agentLevel: body.agentLevel ?? "",
      classificationExplanation: body.classificationExplanation ?? {},
      governance: body.governance ?? {},
      riskScenarios: body.riskScenarios ?? [],
      submittedByRole: body.submittedByRole ?? UserRole.EMPLOYEE,
      reviewNotes: body.reviewNotes ?? "",
      status: autoApprove
        ? RequestStatus.AUTO_APPROVED
        : RequestStatus.PENDING_CISO,
      assignedTo: autoApprove ? null : UserRole.CISO,
      submittedByUserId: body.submittedByUserId ?? "",
      agentPurpose: body.agentPurpose ?? "",
      autoApprovalEligible: body.autoApprovalEligible ?? false,
      autoApprovalReason: body.autoApprovalReason ?? null,
      approvedBy: autoApprove ? "SYSTEM_AUTO_APPROVAL" : null,
      resolvedAt: autoApprove ? new Date() : null,
    });

    return NextResponse.json(
      { success: true, request },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * List agent assessment requests, newest first.
 *
 * Query params:
 * - `assignedTo` — filter by role inbox (`EMPLOYEE` | `MANAGER` | `CISO`)
 * - `status` — filter by request status
 *
 * @returns `{ success: true, requests }` or `400` / `500` error payload
 */
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const assignedTo = searchParams.get("assignedTo");
    const status = searchParams.get("status");

    const filter: Record<string, string> = {};

    if (assignedTo) {
      if (!isUserRole(assignedTo)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid assignedTo. Allowed: ${Object.values(UserRole).join(", ")}`,
          },
          { status: 400 },
        );
      }
      filter.assignedTo = assignedTo;
    }

    if (status) {
      if (!isRequestStatus(status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status. Allowed: ${Object.values(RequestStatus).join(", ")}`,
          },
          { status: 400 },
        );
      }
      filter.status = status;
    }

    const requests = await AgentRequest.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, requests });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
