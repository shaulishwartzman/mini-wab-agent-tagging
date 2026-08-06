/**
 * HistoryStatusFilters — sub-filter controls for CISO approval history.
 *
 * Layout:
 * - הכל / נדחו — plain buttons (hidden when active)
 * - מאושרות — dropdown:
 *   - כל המאושרות (APPROVED + AUTO_APPROVED)
 *   - אוטומטי בלבד (AUTO_APPROVED)
 *
 * Active mode is hidden from the dropdown options / sibling buttons.
 *
 * @see lib/utils/dashboardFilters.ts - modes and helpers
 */

"use client";

import { useEffect, useRef, useState } from "react";
import {
  HistoryFilterMode,
  getApprovedDropdownLabel,
  getVisibleApprovedHistoryOptions,
  isApprovedHistoryMode,
  showHistoryAllButton,
  showHistoryRejectedButton,
  type HistoryFilterMode as HistoryFilterModeType,
} from "@/lib/utils/dashboardFilters";

export type HistoryStatusFiltersProps = {
  /** Currently applied history sub-filter. */
  current: HistoryFilterModeType;
  /** Called when the user picks another sub-filter. */
  onChange: (mode: HistoryFilterModeType) => void;
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  backgroundColor: "#ffffff",
  color: "#334155",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

/**
 * Compact filter row with an approved-status dropdown.
 */
export function HistoryStatusFilters({
  current,
  onChange,
}: HistoryStatusFiltersProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const approvedOptions = getVisibleApprovedHistoryOptions(current);
  const approvedActive = isApprovedHistoryMode(current);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [current]);

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginBottom: "16px",
        direction: "rtl",
        alignItems: "center",
      }}
      role="group"
      aria-label="סינון היסטוריית אישורים"
    >
      {showHistoryAllButton(current) && (
        <button
          type="button"
          onClick={() => onChange(HistoryFilterMode.ALL)}
          style={buttonStyle}
        >
          הכל
        </button>
      )}

      {approvedOptions.length > 0 && (
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              ...buttonStyle,
              backgroundColor: approvedActive ? "#eff6ff" : "#ffffff",
              borderColor: approvedActive ? "#93c5fd" : "#cbd5e1",
              color: approvedActive ? "#1e40af" : "#334155",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {getApprovedDropdownLabel(current)}
            <span aria-hidden style={{ fontSize: 10 }}>
              {menuOpen ? "▲" : "▼"}
            </span>
          </button>

          {menuOpen && (
            <div
              role="listbox"
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                zIndex: 30,
                minWidth: 160,
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
                overflow: "hidden",
              }}
            >
              {approvedOptions.map((opt) => (
                <button
                  key={opt.mode}
                  type="button"
                  role="option"
                  onClick={() => {
                    onChange(opt.mode);
                    setMenuOpen(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "right",
                    padding: "10px 14px",
                    border: "none",
                    backgroundColor: "transparent",
                    color: "#334155",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showHistoryRejectedButton(current) && (
        <button
          type="button"
          onClick={() => onChange(HistoryFilterMode.REJECTED)}
          style={buttonStyle}
        >
          נדחו
        </button>
      )}
    </div>
  );
}
