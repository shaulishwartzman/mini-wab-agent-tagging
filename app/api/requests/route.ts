/**
 * Collection API for AI Agent assessment requests.
 *
 * - `POST /api/requests` — create a new request in MongoDB
 * - `GET  /api/requests` — list requests with filters and pagination
 *
 * GET Query Params:
 * - `assignedTo` — filter by role inbox (CISO, MANAGER)
 * - `assignedToUserId` — filter by specific user (for manager routing)
 * - `submittedByUserId` — filter by submitter (for "my requests")
 * - `status` — single status or comma-separated list (e.g. PENDING_CISO,PENDING_MANAGER)
 * - `page` — page number (default 1)
 * - `limit` — items per page (default 10, max 50)
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
 * List agent assessment requests with filtering and pagination.
 *
 * Query params:
 * - `assignedTo` — filter by role inbox (EMPLOYEE | MANAGER | CISO)
 * - `assignedToUserId` — filter by specific user assignment (for manager routing)
 * - `submittedByUserId` — filter by who submitted the request
 * - `status` — single status, or comma-separated list for `$in` match
 *   (e.g. `PENDING_CISO,PENDING_MANAGER` for active/open requests)
 * - `page` — page number (default: 1)
 * - `limit` — items per page (default: 10, max: 50)
 *
 * Used by CISO dashboard filters:
 * - ממתין לטיפולי → `assignedTo=CISO`
 * - בקשות פעילות → `status=PENDING_CISO,PENDING_MANAGER`
 * - אושרו אוטומטית → `status=AUTO_APPROVED`
 *
 * @returns `{ success, requests, pagination }` or `400` / `500` error payload
 */
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // Filter params
    const assignedTo = searchParams.get("assignedTo");
    const assignedToUserId = searchParams.get("assignedToUserId");
    const submittedByUserId = searchParams.get("submittedByUserId");
    const status = searchParams.get("status");

    // Pagination params (with bounds)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    // Mongo filter may include `$in` for multi-status queries
    const filter: Record<string, unknown> = {};

    // Validate and apply assignedTo filter
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

    // Apply assignedToUserId filter (for manager-specific routing)
    if (assignedToUserId) {
      filter.assignedToUserId = assignedToUserId;
    }

    // Apply submittedByUserId filter (for "my requests" view)
    if (submittedByUserId) {
      filter.submittedByUserId = submittedByUserId;
    }

    // Validate and apply status filter (single value or comma-separated list)
    if (status) {
      const statuses = status
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      for (const s of statuses) {
        if (!isRequestStatus(s)) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid status "${s}". Allowed: ${Object.values(RequestStatus).join(", ")}`,
            },
            { status: 400 },
          );
        }
      }

      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }

    // Get total count for pagination
    const total = await AgentRequest.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Fetch paginated results
    const requests = await AgentRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
