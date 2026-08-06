/**
 * Shared utilities for request display and transformation.
 *
 * Contains helpers for:
 * - Converting API responses to UI card shape
 * - Status labels in Hebrew
 * - Status badge colors
 * - Read-only questionnaire answer resolution (for CISO/Manager review)
 *
 * @see components/RequestQueue.tsx - Main consumer
 * @see components/AgentForm.tsx - Form submission + approved agents
 */

import { RequestStatus, type AgentCard } from "@/lib/types";
import type { AgentRequestResponse } from "@/lib/api/requests";
import { fields } from "@/components/questionnaire/fields";

export type { AgentCard };

/**
 * Convert API response to UI card shape.
 *
 * @param res - API response from /api/requests
 * @returns AgentCard for UI components
 */
export function toAgentCard(res: AgentRequestResponse): AgentCard {
  return {
    id: res._id,
    agentName: res.agentName,
    agentLevel: res.agentLevel,
    classification: res.classification,
    classificationExplanation: res.classificationExplanation,
    governance: res.governance,
    riskScenarios: res.riskScenarios,
  };
}

/**
 * Resolve a stored answer value to a human-readable label.
 *
 * For radio questions, maps option_id → option label.
 * For free-text questions, returns the raw text as stored in MongoDB.
 *
 * @param questionId - Questionnaire field id (e.g. q1_autonomy, gov_owner)
 * @param value - Stored answer (option id or free text)
 * @returns Display string for read-only review UI
 */
export function getReadableAnswer(
  questionId: string,
  value: string | undefined
): string {
  if (!value) return "—";
  const field = fields.find((f) => f.question_id === questionId);
  if (!field) return value;
  if (field.type === "text") return value;
  const option = field.options?.find((o) => o.option_id === value);
  return option ? option.label : value;
}

/** One row in the read-only questionnaire review panel. */
export type QuestionnaireAnswerRow = {
  questionId: string;
  questionText: string;
  answerDisplay: string;
  /** True for free-text governance fields. */
  isFreeText: boolean;
};

/**
 * Build ordered, read-only rows for all questionnaire fields from stored answers.
 *
 * Used by RequestQueue expand panel so CISO/Manager can review the submission
 * without editing. Free-text values are shown as raw text from the DB.
 *
 * @param answers - Raw answers map from AgentRequest
 * @returns Ordered list of question + display answer rows
 */
export function getQuestionnaireAnswerRows(
  answers: Record<string, string> | undefined
): QuestionnaireAnswerRow[] {
  const map = answers ?? {};
  return fields.map((field) => ({
    questionId: field.question_id,
    questionText: field.question_text,
    answerDisplay: getReadableAnswer(field.question_id, map[field.question_id]),
    isFreeText: field.type === "text",
  }));
}

/**
 * Hebrew status labels for display.
 */
export const STATUS_LABELS: Record<string, string> = {
  [RequestStatus.PENDING_CISO]: "ממתין לאישור CISO",
  [RequestStatus.PENDING_MANAGER]: "ממתין להמלצת מנהל",
  [RequestStatus.AUTO_APPROVED]: "אושר אוטומטית",
  [RequestStatus.APPROVED]: "מאושר",
  [RequestStatus.REJECTED]: "נדחה",
};

/**
 * Get Hebrew label for a status.
 *
 * @param status - Request status string
 * @returns Hebrew label, or the raw status if unknown
 */
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

/**
 * Status badge styles (background + text color).
 */
export type StatusBadgeStyle = {
  backgroundColor: string;
  color: string;
  borderColor?: string;
};

/**
 * Color schemes for status badges.
 */
export const STATUS_COLORS: Record<string, StatusBadgeStyle> = {
  [RequestStatus.PENDING_CISO]: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    borderColor: "#fcd34d",
  },
  [RequestStatus.PENDING_MANAGER]: {
    backgroundColor: "#e0e7ff",
    color: "#3730a3",
    borderColor: "#a5b4fc",
  },
  [RequestStatus.AUTO_APPROVED]: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
    borderColor: "#6ee7b7",
  },
  [RequestStatus.APPROVED]: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderColor: "#86efac",
  },
  [RequestStatus.REJECTED]: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderColor: "#fca5a5",
  },
};

/**
 * Get badge style for a status.
 *
 * @param status - Request status string
 * @returns StatusBadgeStyle object with colors
 */
export function getStatusBadgeStyle(status: string): StatusBadgeStyle {
  return (
    STATUS_COLORS[status] || {
      backgroundColor: "#f1f5f9",
      color: "#475569",
      borderColor: "#cbd5e1",
    }
  );
}

/**
 * Check if a status is terminal (no further actions allowed).
 *
 * @param status - Request status string
 * @returns true if APPROVED, REJECTED, or AUTO_APPROVED
 */
export function isTerminalStatus(status: string): boolean {
  const terminal: string[] = [
    RequestStatus.APPROVED,
    RequestStatus.REJECTED,
    RequestStatus.AUTO_APPROVED,
  ];
  return terminal.includes(status);
}

/**
 * Format a date for display in Hebrew locale.
 *
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "6 באוג׳ 2026, 10:30")
 */
export function formatDate(date: string | Date | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get manager recommendation label in Hebrew.
 *
 * @param recommendation - RECOMMEND_APPROVE or RECOMMEND_REJECT
 * @returns Hebrew label
 */
export function getRecommendationLabel(
  recommendation: string | null | undefined
): string {
  if (!recommendation) return "—";
  if (recommendation === "RECOMMEND_APPROVE") return "ממליץ לאשר";
  if (recommendation === "RECOMMEND_REJECT") return "ממליץ לדחות";
  return recommendation;
}
