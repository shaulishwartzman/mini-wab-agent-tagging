/**
 * Dashboard queue filter presets by role / tab.
 *
 * Keeps tab → API filter mapping in one place so `app/page.tsx` stays thin.
 * CISO history supports sub-filters: all | approved | auto | rejected.
 * "Approved" is a dropdown: כל המאושרות | אוטומטי בלבד.
 *
 * @see components/DashboardTabs.tsx - Tab ids/labels
 * @see components/HistoryStatusFilters.tsx - History sub-filter buttons
 * @see app/page.tsx - Renders RequestQueue with these filters
 */

import { RequestStatus, UserRole } from "@/lib/types";
import type { FetchRequestsOptions } from "@/lib/api/requests";

/** One dashboard queue view: title + API filter + whether actions show. */
export type QueueViewConfig = {
  title: string;
  filter: FetchRequestsOptions;
  showActions: boolean;
};

/** Sub-filter modes for CISO approval history. */
export const HistoryFilterMode = {
  ALL: "all",
  /** Manual CISO/manager approval + green-path auto-approval. */
  APPROVED: "approved",
  /** Green-path AUTO_APPROVED only. */
  AUTO_APPROVED: "auto",
  REJECTED: "rejected",
} as const;
export type HistoryFilterMode =
  (typeof HistoryFilterMode)[keyof typeof HistoryFilterMode];

/** Status lists for each history sub-filter. */
export const HISTORY_STATUS_BY_MODE: Record<HistoryFilterMode, string[]> = {
  [HistoryFilterMode.ALL]: [
    RequestStatus.APPROVED,
    RequestStatus.REJECTED,
    RequestStatus.AUTO_APPROVED,
  ],
  [HistoryFilterMode.APPROVED]: [
    RequestStatus.APPROVED,
    RequestStatus.AUTO_APPROVED,
  ],
  [HistoryFilterMode.AUTO_APPROVED]: [RequestStatus.AUTO_APPROVED],
  [HistoryFilterMode.REJECTED]: [RequestStatus.REJECTED],
};

/** Options inside the "מאושרות" dropdown. */
export type ApprovedHistoryOption = {
  mode: typeof HistoryFilterMode.APPROVED | typeof HistoryFilterMode.AUTO_APPROVED;
  label: string;
};

export const APPROVED_HISTORY_OPTIONS: ApprovedHistoryOption[] = [
  { mode: HistoryFilterMode.APPROVED, label: "כל המאושרות" },
  { mode: HistoryFilterMode.AUTO_APPROVED, label: "אוטומטי בלבד" },
];

/**
 * Whether the current mode is one of the approved-family filters.
 */
export function isApprovedHistoryMode(mode: HistoryFilterMode): boolean {
  return (
    mode === HistoryFilterMode.APPROVED ||
    mode === HistoryFilterMode.AUTO_APPROVED
  );
}

/**
 * Label for the approved dropdown trigger.
 * Shows the active approved subtype when that family is selected.
 */
export function getApprovedDropdownLabel(current: HistoryFilterMode): string {
  if (current === HistoryFilterMode.AUTO_APPROVED) return "אוטומטי בלבד";
  if (current === HistoryFilterMode.APPROVED) return "כל המאושרות";
  return "מאושרות";
}

/**
 * Approved-dropdown options to show (hides the active approved subtype).
 *
 * @param current - Active history sub-filter
 */
export function getVisibleApprovedHistoryOptions(
  current: HistoryFilterMode
): ApprovedHistoryOption[] {
  return APPROVED_HISTORY_OPTIONS.filter((o) => o.mode !== current);
}

/**
 * Whether to show the top-level "הכל" button.
 */
export function showHistoryAllButton(current: HistoryFilterMode): boolean {
  return current !== HistoryFilterMode.ALL;
}

/**
 * Whether to show the top-level "נדחו" button.
 */
export function showHistoryRejectedButton(current: HistoryFilterMode): boolean {
  return current !== HistoryFilterMode.REJECTED;
}

/**
 * Build the API filter for a history sub-filter mode.
 *
 * @param mode - all | approved | auto | rejected
 */
export function getHistoryFilterOptions(
  mode: HistoryFilterMode
): FetchRequestsOptions {
  return { status: HISTORY_STATUS_BY_MODE[mode] };
}

/**
 * Human title for the history queue under the current sub-filter.
 *
 * @param mode - Active history sub-filter
 */
export function getHistoryTitle(mode: HistoryFilterMode): string {
  switch (mode) {
    case HistoryFilterMode.APPROVED:
      return "היסטוריה — כל המאושרות";
    case HistoryFilterMode.AUTO_APPROVED:
      return "היסטוריה — אוטומטי בלבד";
    case HistoryFilterMode.REJECTED:
      return "היסטוריה — נדחו";
    default:
      return "היסטוריית אישורים";
  }
}

/**
 * CISO tab id → queue view.
 *
 * - pending: needs CISO action now
 * - active: open pipeline (incl. with manager)
 * - history: base terminal view (sub-filter applied separately in the page)
 */
export const CISO_QUEUE_VIEWS: Record<string, QueueViewConfig> = {
  pending: {
    title: "ממתין לטיפולי",
    filter: { assignedTo: UserRole.CISO },
    showActions: true,
  },
  active: {
    title: "בקשות פעילות",
    filter: {
      status: [RequestStatus.PENDING_CISO, RequestStatus.PENDING_MANAGER],
    },
    showActions: true,
  },
  history: {
    title: "היסטוריית אישורים",
    filter: getHistoryFilterOptions(HistoryFilterMode.ALL),
    showActions: false,
  },
};

/**
 * Resolve a CISO tab id to its queue view, or null if unknown.
 *
 * For the history tab, prefer `getHistoryFilterOptions` + `getHistoryTitle`
 * with the active `HistoryFilterMode` from page state.
 *
 * @param tabId - Active dashboard tab id
 */
export function getCisoQueueView(tabId: string): QueueViewConfig | null {
  return CISO_QUEUE_VIEWS[tabId] ?? null;
}
