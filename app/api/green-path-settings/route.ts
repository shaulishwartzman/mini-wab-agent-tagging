/**
 * Green Path Settings API — CISO-configurable auto-approval criteria.
 *
 * - GET  /api/green-path-settings — current org settings (or defaults)
 * - PUT  /api/green-path-settings — save for the CISO's organization
 *
 * Settings are per-organization. `enabled: false` turns off all auto-approval.
 *
 * @see models/GreenPathSettings.ts
 * @see lib/auto-approval/greenPathCriteria.ts
 * @see lib/auto-approval/loadSettings.ts
 */

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import GreenPathSettings from "@/models/GreenPathSettings";
import { UserRole } from "@/lib/types";
import {
  DISQUALIFYING_ANSWER,
  GREEN_PATH_QUESTION_IDS,
  type AllowedAnswersMap,
  type GreenPathQuestionId,
} from "@/lib/auto-approval/greenPathCriteria";
import { loadGreenPathSettingsForOrg } from "@/lib/auto-approval/loadSettings";
import { fields } from "@/components/questionnaire/fields";
import { getAuthUser } from "@/lib/auth/session";

/** Valid option ids per question (excluding U0). */
function getValidOptionIds(questionId: GreenPathQuestionId): Set<string> {
  const field = fields.find((f) => f.question_id === questionId);
  const ids = (field?.options ?? [])
    .map((o) => o.option_id)
    .filter((id) => id !== DISQUALIFYING_ANSWER);
  return new Set(ids);
}

/**
 * Validate allowedAnswers from PUT body.
 *
 * @returns Normalized map or an error message
 */
function validateAllowedAnswers(
  raw: unknown
): { ok: true; value: AllowedAnswersMap } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Missing or invalid allowedAnswers" };
  }

  const input = raw as Record<string, unknown>;
  const result = {} as AllowedAnswersMap;

  for (const questionId of GREEN_PATH_QUESTION_IDS) {
    const list = input[questionId];
    if (!Array.isArray(list) || list.length === 0) {
      return {
        ok: false,
        error: `${questionId}: must include at least one allowed option`,
      };
    }

    const valid = getValidOptionIds(questionId);
    const normalized: string[] = [];

    for (const item of list) {
      if (typeof item !== "string") {
        return { ok: false, error: `${questionId}: invalid option value` };
      }
      if (item === DISQUALIFYING_ANSWER) {
        return {
          ok: false,
          error: `${questionId}: "${DISQUALIFYING_ANSWER}" cannot be part of the green path`,
        };
      }
      if (!valid.has(item)) {
        return {
          ok: false,
          error: `${questionId}: unknown option "${item}"`,
        };
      }
      if (!normalized.includes(item)) {
        normalized.push(item);
      }
    }

    result[questionId] = normalized;
  }

  return { ok: true, value: result };
}

/**
 * GET current green path settings for the caller's organization.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();
    const settings = await loadGreenPathSettingsForOrg(user.organizationId);
    return NextResponse.json({ success: true, settings });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

type PutBody = {
  allowedAnswers?: unknown;
  enabled?: unknown;
  actorRole?: unknown;
  actorUserId?: string;
};

/**
 * PUT upsert green path settings for the CISO's organization.
 */
export async function PUT(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body: PutBody = await req.json();

    const isCisoActor =
      user.role === UserRole.CISO ||
      (user.role === UserRole.SYSTEM_ADMIN && body.actorRole === UserRole.CISO);

    if (!isCisoActor) {
      return NextResponse.json(
        {
          success: false,
          error: "Only CISO can update green path settings",
        },
        { status: 403 },
      );
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: "User has no organization" },
        { status: 400 },
      );
    }

    const validated = validateAllowedAnswers(body.allowedAnswers);
    if (!validated.ok) {
      return NextResponse.json(
        { success: false, error: validated.error },
        { status: 400 },
      );
    }

    const enabled = body.enabled !== false;
    const organizationId = new mongoose.Types.ObjectId(user.organizationId);

    await connectDB();

    const doc = await GreenPathSettings.findOneAndUpdate(
      { organizationId },
      {
        key: `org:${user.organizationId}`,
        organizationId,
        allowedAnswers: validated.value,
        enabled,
        updatedBy: body.actorUserId ?? user.id ?? null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return NextResponse.json({
      success: true,
      settings: {
        allowedAnswers: validated.value,
        enabled,
        updatedBy: doc?.updatedBy ?? body.actorUserId ?? null,
        updatedAt: doc?.updatedAt
          ? new Date(doc.updatedAt as Date).toISOString()
          : new Date().toISOString(),
        isDefault: false,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
