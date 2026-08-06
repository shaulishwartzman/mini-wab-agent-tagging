/**
 * Green Path Criteria for Auto-Approval Engine.
 *
 * PURPOSE: Defines default criteria that determine whether an agent
 * assessment request qualifies for automatic approval without CISO review.
 *
 * BUSINESS LOGIC:
 * A request is auto-approved ONLY if ALL conditions are met:
 * 1. All closed questions (A-B-C-M) match allowed answers
 * 2. All REQUIRED_TEXT_FIELDS are non-empty (for documentation/audit)
 * 3. No answers are DISQUALIFYING_ANSWER (U0 = unknown)
 *
 * CISO can customize allowed closed answers via /green-path (MongoDB).
 * Defaults below are used when no settings exist or fetch fails (fail-safe).
 *
 * @see lib/auto-approval/rulesEngine.ts - Evaluation function
 * @see app/green-path/page.tsx - CISO settings UI
 * @see components/questionnaire/fields.ts - Question definitions
 */

/**
 * Required answers for the default "green path" auto-approval.
 *
 * Lowest-risk configuration:
 * - A1: Human-in-the-loop
 * - B1: Public/SaaS LLM
 * - C1: Read-Only
 * - M1: Isolated System
 *
 * Keys match question_id from fields.ts.
 */
export const GREEN_PATH_ANSWERS = {
  q1_autonomy: "A1",
  q2_brain: "B1",
  q3_capability: "C1",
  q4_management: "M1",
} as const;

/** Type for the default green path answers object. */
export type GreenPathAnswers = typeof GREEN_PATH_ANSWERS;

/** Question IDs that have green path requirements. */
export type GreenPathQuestionId = keyof GreenPathAnswers;

/** Ordered list of green-path question ids. */
export const GREEN_PATH_QUESTION_IDS: GreenPathQuestionId[] = [
  "q1_autonomy",
  "q2_brain",
  "q3_capability",
  "q4_management",
];

/**
 * Allowed answers map shape used in MongoDB settings and CustomCriteria.
 */
export type AllowedAnswersMap = Record<GreenPathQuestionId, string[]>;

/**
 * Convert hardcoded GREEN_PATH_ANSWERS into the multi-select settings shape.
 *
 * @returns Default allowedAnswers (each dimension has a single option)
 */
export function getDefaultAllowedAnswers(): AllowedAnswersMap {
  return {
    q1_autonomy: [GREEN_PATH_ANSWERS.q1_autonomy],
    q2_brain: [GREEN_PATH_ANSWERS.q2_brain],
    q3_capability: [GREEN_PATH_ANSWERS.q3_capability],
    q4_management: [GREEN_PATH_ANSWERS.q4_management],
  };
}

/**
 * Wrap an allowedAnswers map for the rules engine `customCriteria` arg.
 *
 * @param allowedAnswers - Per-question allowed option ids
 */
export function toCustomCriteria(
  allowedAnswers: AllowedAnswersMap | Record<string, string[]>
): { allowedAnswers: Record<string, string[]> } {
  return { allowedAnswers };
}

/**
 * Text fields that must be filled for auto-approval.
 * Not editable via CISO settings UI in MVP.
 */
export const REQUIRED_TEXT_FIELDS = [
  "gov_owner",
  "gov_tech",
  "gov_approver",
  "gov_monitoring",
] as const;

export type RequiredTextField = (typeof REQUIRED_TEXT_FIELDS)[number];

/**
 * Answer option ID that disqualifies auto-approval ("לא ידוע").
 * Never selectable as a green-path allowed answer.
 */
export const DISQUALIFYING_ANSWER = "U0";

/** Section titles for the settings UI (Hebrew). */
export const GREEN_PATH_SECTION_TITLES: Record<GreenPathQuestionId, string> = {
  q1_autonomy: "רמת אוטונומיה מאושרת",
  q2_brain: "ארכיטקטורה מאושרת",
  q3_capability: "הרשאות מאושרות",
  q4_management: "מבנה ניהול מאושר",
};

/**
 * Human-readable labels for default green path criteria (for UI/logs).
 */
export const GREEN_PATH_LABELS: Record<GreenPathQuestionId, string> = {
  q1_autonomy: "מבוקרת (Human-in-the-loop)",
  q2_brain: "מודל ענן ציבורי/חיצוני (Public/SaaS LLM)",
  q3_capability: "גישת קריאה בלבד (Read-Only)",
  q4_management: "נקודתי (Isolated System)",
};

export const REQUIRED_TEXT_FIELD_LABELS: Record<RequiredTextField, string> = {
  gov_owner: "מנהל אחראי",
  gov_tech: "אחראי טכני",
  gov_approver: "מאשר שינויים",
  gov_monitoring: "מנגנון פיקוח",
};
