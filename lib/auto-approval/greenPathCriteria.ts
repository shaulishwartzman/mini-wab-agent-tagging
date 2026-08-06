/**
 * Green Path Criteria for Auto-Approval Engine.
 *
 * PURPOSE: Defines the hardcoded criteria that determine whether an agent
 * assessment request qualifies for automatic approval without CISO review.
 *
 * BUSINESS LOGIC:
 * A request is auto-approved ONLY if ALL conditions are met:
 * 1. All closed questions (A-B-C-M) match GREEN_PATH_ANSWERS exactly
 * 2. All REQUIRED_TEXT_FIELDS are non-empty (for documentation/audit)
 * 3. No answers are DISQUALIFYING_ANSWER (U0 = unknown)
 *
 * If ANY condition fails, the request goes to PENDING_CISO for manual review.
 *
 * NOTE: These criteria are hardcoded (no admin UI) per MVP specification.
 * Changes to criteria require code deployment.
 *
 * @see lib/auto-approval/rulesEngine.ts - Evaluation function (next task)
 * @see components/questionnaire/fields.ts - Question definitions
 */

/**
 * Required answers for the "green path" auto-approval.
 *
 * These represent the lowest-risk configuration:
 * - A1: Human-in-the-loop (controlled, no autonomous decisions)
 * - B1: Public/SaaS LLM (no internal data exposure)
 * - C1: Read-Only (no write permissions to systems)
 * - M1: Isolated System (single user, no multi-agent coordination)
 *
 * Keys match question_id from fields.ts.
 */
export const GREEN_PATH_ANSWERS = {
  /** Autonomy level: Human-in-the-loop (controlled) */
  q1_autonomy: "A1",
  /** Architecture: Public/SaaS LLM (no internal data access) */
  q2_brain: "B1",
  /** Capabilities: Read-Only (no write permissions) */
  q3_capability: "C1",
  /** Management: Isolated System (single user tool) */
  q4_management: "M1",
} as const;

/**
 * Type for the green path answers object.
 */
export type GreenPathAnswers = typeof GREEN_PATH_ANSWERS;

/**
 * Type for question IDs that have green path requirements.
 */
export type GreenPathQuestionId = keyof GreenPathAnswers;

/**
 * Text fields that must be filled for auto-approval.
 *
 * These fields don't affect the auto-approval decision logic, but they
 * must be non-empty to ensure proper documentation exists for:
 * - Post-audit review by CISO
 * - Accountability tracking
 * - Governance compliance
 *
 * If any field is empty, the request goes to PENDING_CISO.
 */
export const REQUIRED_TEXT_FIELDS = [
  /** Accountable manager - senior manager responsible for the agent */
  "gov_owner",
  /** Technical owner - responsible for ongoing management */
  "gov_tech",
  /** Change approver - authorized to approve significant changes */
  "gov_approver",
  /** Monitoring mechanism - how the agent is monitored */
  "gov_monitoring",
] as const;

/**
 * Type for required text field names.
 */
export type RequiredTextField = (typeof REQUIRED_TEXT_FIELDS)[number];

/**
 * Answer option ID that disqualifies auto-approval.
 *
 * "U0" means "unknown / requires organizational input" - if the submitter
 * doesn't know the answer, the request must be reviewed manually.
 */
export const DISQUALIFYING_ANSWER = "U0";

/**
 * Human-readable labels for green path criteria (for UI/logs).
 */
export const GREEN_PATH_LABELS: Record<GreenPathQuestionId, string> = {
  q1_autonomy: "מבוקרת (Human-in-the-loop)",
  q2_brain: "מודל ענן ציבורי/חיצוני (Public/SaaS LLM)",
  q3_capability: "גישת קריאה בלבד (Read-Only)",
  q4_management: "נקודתי (Isolated System)",
};

/**
 * Human-readable labels for required text fields (for UI/logs).
 */
export const REQUIRED_TEXT_FIELD_LABELS: Record<RequiredTextField, string> = {
  gov_owner: "מנהל אחראי",
  gov_tech: "אחראי טכני",
  gov_approver: "מאשר שינויים",
  gov_monitoring: "מנגנון פיקוח",
};
