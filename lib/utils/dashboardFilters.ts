/**
 * Dashboard queue filter presets by role / tab.
 *
 * Keeps tab → API filter mapping in one place so `app/page.tsx` stays thin.
 * CISO history supports sub-filters: all | approved | rejected.
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
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;
export type HistoryFilterMode =
  (typeof HistoryFilterMode)[keyof typeof HistoryFilterMode];

/** Status lists for each history sub-filter. */
export const HISTORY_STATUS_BY_MODE: Record<
  HistoryFilterMode,
  string[]
> = {
  [HistoryFilterMode.ALL]: [
    RequestStatus.APPROVED,
    RequestStatus.REJECTED,
    RequestStatus.AUTO_APPROVED,
  ],
  // Manual + green-path approvals
  [HistoryFilterMode.APPROVED]: [
    RequestStatus.APPROVED,
    RequestStatus.AUTO_APPROVED,
  ],
  [HistoryFilterMode.REJECTED]: [RequestStatus.REJECTED],
};

/** Button meta for history sub-filters (label + which mode it selects). */
export type HistoryFilterButton = {
  mode: HistoryFilterMode;
  label: string;
};

/**
 * All history filter buttons. UI hides the one matching the current mode.
 *
 * - הכל — full terminal history
 * - מאושרות — APPROVED + AUTO_APPROVED
 * - נדחו — REJECTED only
 */
export const HISTORY_FILTER_BUTTONS: HistoryFilterButton[] = [
  { mode: HistoryFilterMode.ALL, label: "הכל" },
  { mode: HistoryFilterMode.APPROVED, label: "מאושרות" },
  { mode: HistoryFilterMode.REJECTED, label: "נדחו" },
];

/**
 * Buttons to show for the current history mode (hides the active selection).
 *
 * @param current - Active history sub-filter
 */
export function getVisibleHistoryFilterButtons(
  current: HistoryFilterMode
): HistoryFilterButton[] {
  return HISTORY_FILTER_BUTTONS.filter((b) => b.mode !== current);
}

/**
 * Build the API filter for a history sub-filter mode.
 *
 * @param mode - all | approved | rejected
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
      return "היסטוריה — מאושרות";
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
