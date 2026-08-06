/**
 * Auto-Approval Rules Engine.
 *
 * PURPOSE: Evaluates agent assessment requests against green path criteria
 * to determine if they qualify for automatic approval.
 *
 * FAIL-SAFE DEFAULTS:
 * - Any deviation from green path → PENDING_CISO
 * - Any "unknown" (U0) answer → PENDING_CISO
 * - Any missing required text field → PENDING_CISO
 * - Any error during evaluation → PENDING_CISO
 *
 * The system is designed to be CONSERVATIVE: when in doubt, require human review.
 *
 * @see lib/auto-approval/greenPathCriteria.ts - Default criteria constants
 */

import {
  GREEN_PATH_ANSWERS,
  REQUIRED_TEXT_FIELDS,
  DISQUALIFYING_ANSWER,
  GREEN_PATH_LABELS,
  REQUIRED_TEXT_FIELD_LABELS,
  type GreenPathQuestionId,
  type RequiredTextField,
} from "./greenPathCriteria";

/**
 * Custom criteria that CISO can use to expand/narrow/change the green path.
 *
 * If not provided, strict defaults from greenPathCriteria.ts are used.
 */
export type CustomCriteria = {
  /**
   * Override allowed answers per question.
   * Each question can have multiple allowed answers (array).
   *
   * Example - allow both A1 and A2 for autonomy:
   * { q1_autonomy: ["A1", "A2"] }
   *
   * If a question is not specified, defaults to GREEN_PATH_ANSWERS.
   */
  allowedAnswers?: Partial<Record<string, string[]>>;

  /**
   * Override which text fields are required.
   * If not specified, defaults to REQUIRED_TEXT_FIELDS.
   */
  requiredTextFields?: string[];

  /**
   * Skip specific checks entirely (use with caution).
   * Even if skipped, U0 answers still disqualify by default.
   */
  skipChecks?: {
    /** Skip closed question matching */
    closedQuestions?: boolean;
    /** Skip text field requirement */
    textFields?: boolean;
    /** Skip U0 disqualification (NOT RECOMMENDED) */
    disqualifyingAnswer?: boolean;
  };
};

/**
 * Result of evaluating a request for auto-approval.
 */
export type EvaluateResult = {
  /** True = eligible for AUTO_APPROVED, False = goes to PENDING_CISO */
  eligible: boolean;

  /** Human-readable explanation of the result */
  reason: string;

  /** List of criteria that failed (empty if eligible) */
  failedCriteria: string[];

  /** What criteria were actually applied (for audit/logging) */
  appliedCriteria: {
    allowedAnswers: Record<string, string[]>;
    requiredTextFields: string[];
    disqualifyingAnswer: string;
  };
};

/**
 * Merge custom criteria with defaults.
 *
 * Custom criteria OVERRIDE defaults, they don't extend them.
 * If a question is not in customCriteria, the default is used.
 */
function mergeWithDefaults(custom?: CustomCriteria): EvaluateResult["appliedCriteria"] {
  const defaultAllowed: Record<string, string[]> = {};
  for (const [questionId, answer] of Object.entries(GREEN_PATH_ANSWERS)) {
    defaultAllowed[questionId] = [answer];
  }

  const allowedAnswers = custom?.allowedAnswers
    ? { ...defaultAllowed, ...custom.allowedAnswers }
    : defaultAllowed;

  const requiredTextFields = custom?.requiredTextFields ?? [...REQUIRED_TEXT_FIELDS];

  return {
    allowedAnswers,
    requiredTextFields,
    disqualifyingAnswer: DISQUALIFYING_ANSWER,
  };
}

/**
 * Check if an answer is the disqualifying "unknown" answer.
 */
function isDisqualifyingAnswer(answer: string): boolean {
  return answer === DISQUALIFYING_ANSWER;
}

/**
 * Check if a closed question answer matches allowed values.
 */
function checkClosedQuestion(
  questionId: string,
  answer: string | undefined,
  allowedAnswers: string[]
): { passed: boolean; reason?: string } {
  if (!answer) {
    return {
      passed: false,
      reason: `שאלה ${questionId}: לא נענתה`,
    };
  }

  if (!allowedAnswers.includes(answer)) {
    const label = GREEN_PATH_LABELS[questionId as GreenPathQuestionId] ?? questionId;
    return {
      passed: false,
      reason: `${questionId}: התשובה "${answer}" אינה בנתיב הירוק (נדרש: ${allowedAnswers.join(" או ")})`,
    };
  }

  return { passed: true };
}

/**
 * Check if a required text field is filled.
 */
function checkTextField(
  fieldId: string,
  answers: Record<string, string>
): { passed: boolean; reason?: string } {
  const value = answers[fieldId];

  if (!value || value.trim() === "") {
    const label = REQUIRED_TEXT_FIELD_LABELS[fieldId as RequiredTextField] ?? fieldId;
    return {
      passed: false,
      reason: `שדה "${label}" (${fieldId}) חסר - נדרש לצורך תיעוד`,
    };
  }

  return { passed: true };
}

/**
 * Evaluate a request for auto-approval eligibility.
 *
 * FAIL-SAFE BEHAVIOR:
 * - Returns eligible=false for ANY deviation from criteria
 * - Returns eligible=false for ANY "unknown" (U0) answer
 * - Returns eligible=false for ANY missing required field
 * - Returns eligible=false on ANY error (fail-safe)
 *
 * @param answers - Form answers (question_id → answer value)
 * @param customCriteria - Optional CISO overrides for criteria
 * @returns EvaluateResult with eligibility, reason, and details
 *
 * @example
 * ```ts
 * // With defaults (strict green path)
 * const result = evaluateForAutoApproval(formAnswers);
 * if (result.eligible) {
 *   // AUTO_APPROVED
 * } else {
 *   // PENDING_CISO - result.reason explains why
 * }
 *
 * // With CISO customization (allow A2 for autonomy)
 * const result = evaluateForAutoApproval(formAnswers, {
 *   allowedAnswers: { q1_autonomy: ["A1", "A2"] }
 * });
 * ```
 */
export function evaluateForAutoApproval(
  answers: Record<string, string>,
  customCriteria?: CustomCriteria
): EvaluateResult {
  const failedCriteria: string[] = [];

  try {
    const appliedCriteria = mergeWithDefaults(customCriteria);
    const skipChecks = customCriteria?.skipChecks ?? {};

    // FAIL-SAFE: Check for disqualifying "unknown" answers first
    if (!skipChecks.disqualifyingAnswer) {
      for (const [questionId, answer] of Object.entries(answers)) {
        if (isDisqualifyingAnswer(answer)) {
          failedCriteria.push(`${questionId}: נבחרה תשובת "לא ידוע" (${DISQUALIFYING_ANSWER})`);
        }
      }

      // If any U0 answers found, immediately fail (fail-safe)
      if (failedCriteria.length > 0) {
        return {
          eligible: false,
          reason: `הבקשה מועברת לטיפול CISO: נמצאו תשובות "לא ידוע" שדורשות בירור`,
          failedCriteria,
          appliedCriteria,
        };
      }
    }

    // Check closed questions against allowed answers
    if (!skipChecks.closedQuestions) {
      for (const [questionId, allowedValues] of Object.entries(appliedCriteria.allowedAnswers)) {
        const result = checkClosedQuestion(questionId, answers[questionId], allowedValues);
        if (!result.passed && result.reason) {
          failedCriteria.push(result.reason);
        }
      }
    }

    // Check required text fields
    if (!skipChecks.textFields) {
      for (const fieldId of appliedCriteria.requiredTextFields) {
        const result = checkTextField(fieldId, answers);
        if (!result.passed && result.reason) {
          failedCriteria.push(result.reason);
        }
      }
    }

    // FAIL-SAFE: Any failed criteria → PENDING_CISO
    if (failedCriteria.length > 0) {
      return {
        eligible: false,
        reason: `הבקשה מועברת לטיפול CISO: ${failedCriteria.length} קריטריונים לא עמדו בתנאי הנתיב הירוק`,
        failedCriteria,
        appliedCriteria,
      };
    }

    // All criteria passed → eligible for auto-approval
    return {
      eligible: true,
      reason: "הבקשה עומדת בכל תנאי הנתיב הירוק - מאושרת אוטומטית",
      failedCriteria: [],
      appliedCriteria,
    };
  } catch (error) {
    // FAIL-SAFE: Any error during evaluation → PENDING_CISO
    return {
      eligible: false,
      reason: "שגיאה בהערכת הבקשה - מועברת לטיפול CISO לבטיחות",
      failedCriteria: ["שגיאת מערכת בהערכה"],
      appliedCriteria: mergeWithDefaults(),
    };
  }
}

/**
 * Quick check if answers have any disqualifying "unknown" values.
 *
 * Utility function for UI to show warning before submit.
 */
export function hasDisqualifyingAnswers(answers: Record<string, string>): boolean {
  return Object.values(answers).some(isDisqualifyingAnswer);
}

/**
 * Get list of missing required text fields.
 *
 * Utility function for UI validation.
 */
export function getMissingTextFields(
  answers: Record<string, string>,
  requiredFields: readonly string[] = REQUIRED_TEXT_FIELDS
): string[] {
  return requiredFields.filter((fieldId) => {
    const value = answers[fieldId];
    return !value || value.trim() === "";
  });
}
