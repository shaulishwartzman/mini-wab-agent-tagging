/**
 * Shared utilities for request display and transformation.
 *
 * Contains helpers for:
 * - Converting API responses to UI card shape
 * - Status labels in Hebrew
 * - Status badge colors
 *
 * @see components/RequestQueue.tsx - Main consumer
 * @see components/AgentForm.tsx - Legacy consumer (form submission)
 */

import { RequestStatus, type AgentCard } from "@/lib/types";
import type { AgentRequestResponse } from "@/lib/api/requests";

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
  return [
    RequestStatus.APPROVED,
    RequestStatus.REJECTED,
    RequestStatus.AUTO_APPROVED,
  ].includes(status as RequestStatus);
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
