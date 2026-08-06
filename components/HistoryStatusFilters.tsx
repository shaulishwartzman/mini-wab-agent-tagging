/**
 * HistoryStatusFilters — sub-filter buttons for CISO approval history.
 *
 * Shows only the filters that are *not* currently active:
 * - Viewing all → מאושרות + נדחו
 * - Viewing approved → הכל + נדחו
 * - Viewing rejected → הכל + מאושרות
 *
 * @see lib/utils/dashboardFilters.ts - modes, labels, getVisibleHistoryFilterButtons
 */

"use client";

import {
  type HistoryFilterMode,
  getVisibleHistoryFilterButtons,
} from "@/lib/utils/dashboardFilters";

export type HistoryStatusFiltersProps = {
  /** Currently applied history sub-filter. */
  current: HistoryFilterMode;
  /** Called when the user picks another sub-filter. */
  onChange: (mode: HistoryFilterMode) => void;
};

/**
 * Compact button row for history status slicing.
 */
export function HistoryStatusFilters({
  current,
  onChange,
}: HistoryStatusFiltersProps) {
  const buttons = getVisibleHistoryFilterButtons(current);

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginBottom: "16px",
        direction: "rtl",
      }}
      role="group"
      aria-label="סינון היסטוריית אישורים"
    >
      {buttons.map((btn) => (
        <button
          key={btn.mode}
          type="button"
          onClick={() => onChange(btn.mode)}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#ffffff",
            color: "#334155",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background-color 0.15s ease",
          }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
