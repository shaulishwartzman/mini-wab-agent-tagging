/**
 * Green Path Settings API — CISO-configurable auto-approval criteria.
 *
 * - GET  /api/green-path-settings — current allowed answers (or defaults)
 * - PUT  /api/green-path-settings — save (CISO only)
 *
 * Used by the settings UI and by AgentForm on submit.
 *
 * @see models/GreenPathSettings.ts
 * @see lib/auto-approval/greenPathCriteria.ts
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import GreenPathSettings from "@/models/GreenPathSettings";
import { UserRole } from "@/lib/types";
import {
  DISQUALIFYING_ANSWER,
  GREEN_PATH_QUESTION_IDS,
  getDefaultAllowedAnswers,
  type AllowedAnswersMap,
  type GreenPathQuestionId,
} from "@/lib/auto-approval/greenPathCriteria";
import { fields } from "@/components/questionnaire/fields";

const SETTINGS_KEY = "default";

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
 * Load settings doc or return defaults (no write on GET).
 */
async function loadSettingsPayload() {
  const doc = await GreenPathSettings.findOne({ key: SETTINGS_KEY }).lean();
  if (!doc) {
    return {
      allowedAnswers: getDefaultAllowedAnswers(),
      updatedBy: null as string | null,
      updatedAt: null as string | null,
      isDefault: true,
    };
  }

  const aa = doc.allowedAnswers as AllowedAnswersMap;
  return {
    allowedAnswers: {
      q1_autonomy: aa.q1_autonomy ?? getDefaultAllowedAnswers().q1_autonomy,
      q2_brain: aa.q2_brain ?? getDefaultAllowedAnswers().q2_brain,
      q3_capability: aa.q3_capability ?? getDefaultAllowedAnswers().q3_capability,
      q4_management: aa.q4_management ?? getDefaultAllowedAnswers().q4_management,
    },
    updatedBy: doc.updatedBy ?? null,
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt as Date).toISOString()
      : null,
    isDefault: false,
  };
}

/**
 * GET current green path settings (defaults if none saved).
 */
export async function GET() {
  try {
    await connectDB();
    const settings = await loadSettingsPayload();
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
  actorRole?: unknown;
  actorUserId?: string;
};

/**
 * PUT upsert green path settings (CISO only).
 */
export async function PUT(req: Request) {
  try {
    const body: PutBody = await req.json();

    if (body.actorRole !== UserRole.CISO) {
      return NextResponse.json(
        {
          success: false,
          error: "Only CISO can update green path settings",
        },
        { status: 403 },
      );
    }

    const validated = validateAllowedAnswers(body.allowedAnswers);
    if (!validated.ok) {
      return NextResponse.json(
        { success: false, error: validated.error },
        { status: 400 },
      );
    }

    await connectDB();

    const doc = await GreenPathSettings.findOneAndUpdate(
      { key: SETTINGS_KEY },
      {
        key: SETTINGS_KEY,
        allowedAnswers: validated.value,
        updatedBy: body.actorUserId ?? null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return NextResponse.json({
      success: true,
      settings: {
        allowedAnswers: validated.value,
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
