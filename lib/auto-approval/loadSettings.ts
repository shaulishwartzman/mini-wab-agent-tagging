/**
 * Load persisted green-path settings for an organization.
 *
 * If no document exists, returns hardcoded defaults with auto-approval enabled.
 *
 * @see models/GreenPathSettings.ts
 * @see lib/auto-approval/greenPathCriteria.ts
 */

import mongoose from "mongoose";
import GreenPathSettings from "@/models/GreenPathSettings";
import {
  getDefaultAllowedAnswers,
  type AllowedAnswersMap,
} from "@/lib/auto-approval/greenPathCriteria";

export type LoadedGreenPathSettings = {
  allowedAnswers: AllowedAnswersMap;
  enabled: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
  isDefault: boolean;
};

function normalizeAllowedAnswers(raw: unknown): AllowedAnswersMap {
  const defaults = getDefaultAllowedAnswers();
  const aa = (raw ?? {}) as Partial<AllowedAnswersMap>;
  return {
    q1_autonomy: aa.q1_autonomy ?? defaults.q1_autonomy,
    q2_brain: aa.q2_brain ?? defaults.q2_brain,
    q3_capability: aa.q3_capability ?? defaults.q3_capability,
    q4_management: aa.q4_management ?? defaults.q4_management,
  };
}

/**
 * Load green-path settings for an organization, or defaults if none saved.
 */
export async function loadGreenPathSettingsForOrg(
  organizationId: string | mongoose.Types.ObjectId | null | undefined
): Promise<LoadedGreenPathSettings> {
  if (!organizationId) {
    return {
      allowedAnswers: getDefaultAllowedAnswers(),
      enabled: true,
      updatedBy: null,
      updatedAt: null,
      isDefault: true,
    };
  }

  const doc = await GreenPathSettings.findOne({ organizationId }).lean();
  if (!doc) {
    return {
      allowedAnswers: getDefaultAllowedAnswers(),
      enabled: true,
      updatedBy: null,
      updatedAt: null,
      isDefault: true,
    };
  }

  return {
    allowedAnswers: normalizeAllowedAnswers(doc.allowedAnswers),
    enabled: doc.enabled !== false,
    updatedBy: doc.updatedBy ?? null,
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt as Date).toISOString()
      : null,
    isDefault: false,
  };
}
