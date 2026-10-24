/**
 * Client-side API helpers for Green Path settings.
 *
 * - fetchGreenPathSettings() — load current (or default) criteria
 * - saveGreenPathSettings() — CISO save
 * - resetGreenPathSettings() — restore A1/B1/C1/M1 defaults and save
 *
 * @see app/api/green-path-settings/route.ts
 * @see lib/auto-approval/greenPathCriteria.ts
 */

import type { UserRole } from "@/lib/types";
import {
  getDefaultAllowedAnswers,
  type AllowedAnswersMap,
} from "@/lib/auto-approval/greenPathCriteria";

/** Settings payload returned by the API. */
export type GreenPathSettingsPayload = {
  allowedAnswers: AllowedAnswersMap;
  enabled: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
  isDefault: boolean;
};

export type GreenPathSettingsResult = {
  success: boolean;
  settings?: GreenPathSettingsPayload;
  error?: string;
  unauthorized?: boolean;
};

/**
 * Fetch current green path settings from the API.
 * On network failure returns success:false (caller should fall back to defaults).
 */
export async function fetchGreenPathSettings(): Promise<GreenPathSettingsResult> {
  try {
    const res = await fetch("/api/green-path-settings");
    return await res.json();
  } catch {
    return { success: false, error: "Network error" };
  }
}

/**
 * Save green path settings (CISO only).
 *
 * @param allowedAnswers - Selected allowed options per dimension
 * @param actorRole - Must be CISO
 * @param actorUserId - Audit user id
 */
export async function saveGreenPathSettings(
  allowedAnswers: AllowedAnswersMap,
  actorRole: (typeof UserRole)[keyof typeof UserRole],
  actorUserId: string,
  enabled = true
): Promise<GreenPathSettingsResult> {
  try {
    const res = await fetch("/api/green-path-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowedAnswers, actorRole, actorUserId, enabled }),
    });
    const data = await res.json();
    if (res.status === 403) {
      return { ...data, unauthorized: true };
    }
    return data;
  } catch {
    return { success: false, error: "Network error" };
  }
}

/**
 * Reset settings to hardcoded defaults and persist via PUT.
 *
 * @param actorRole - Must be CISO
 * @param actorUserId - Audit user id
 */
export async function resetGreenPathSettings(
  actorRole: (typeof UserRole)[keyof typeof UserRole],
  actorUserId: string
): Promise<GreenPathSettingsResult> {
  return saveGreenPathSettings(
    getDefaultAllowedAnswers(),
    actorRole,
    actorUserId,
    true
  );
}
