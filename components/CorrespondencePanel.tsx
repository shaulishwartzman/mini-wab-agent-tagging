/**
 * CorrespondencePanel — collapsible CISO↔manager correspondence.
 *
 * Visible only to CISO and Manager (not employees). Hidden behind a
 * role-specific toggle so request cards stay compact:
 * - CISO: ▼ להתכתבות עם המנהל
 * - Manager: ▼ להתכתבות עם ה-CISO
 *
 * When expanded: past notes (if any) + optional compose textarea (when allowed).
 * Renders nothing when there is no history and compose is disabled.
 *
 * @see components/RequestQueue.tsx - Parent expand panel (gates by role)
 * @see lib/utils/requestHelpers.ts - getRoutingActionLabel(), formatDate()
 */

"use client";

import { useState } from "react";
import { UserRole, type RoutingHistoryEntry } from "@/lib/types";
import {
  formatDate,
  getRoutingActionLabel,
} from "@/lib/utils/requestHelpers";

/** Roles allowed to view / compose CISO↔manager correspondence. */
export type CorrespondenceViewerRole =
  | typeof UserRole.CISO
  | typeof UserRole.MANAGER;

export type CorrespondencePanelProps = {
  /** Full routing history; only entries with non-empty notes are shown. */
  routingHistory: RoutingHistoryEntry[] | undefined;
  /** Viewer role — drives the toggle label and compose placeholder. */
  viewerRole: CorrespondenceViewerRole;
  /** When true, show an optional note textarea inside the dropdown. */
  canCompose?: boolean;
  /** Draft note value (controlled by parent). */
  draftNote?: string;
  /** Called when the draft note changes. */
  onDraftNoteChange?: (value: string) => void;
  /** DOM id for the textarea (accessibility). */
  draftNoteId?: string;
};

function getToggleLabel(
  viewerRole: CorrespondenceViewerRole,
  expanded: boolean
): string {
  if (viewerRole === UserRole.CISO) {
    return expanded
      ? "▲ הסתר התכתבות עם המנהל"
      : "▼ להתכתבות עם המנהל";
  }
  return expanded
    ? "▲ הסתר התכתבות עם ה-CISO"
    : "▼ להתכתבות עם ה-CISO";
}

function getComposePlaceholder(viewerRole: CorrespondenceViewerRole): string {
  if (viewerRole === UserRole.CISO) {
    return "הערה או שאלה למנהל (אופציונלי)";
  }
  return "הערה או תשובה ל-CISO (אופציונלי)";
}

/**
 * Collapsible CISO↔manager thread + optional compose field.
 */
export function CorrespondencePanel({
  routingHistory,
  viewerRole,
  canCompose = false,
  draftNote = "",
  onDraftNoteChange,
  draftNoteId,
}: CorrespondencePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const notes = (routingHistory ?? []).filter((e) => e.notes?.trim());

  if (notes.length === 0 && !canCompose) return null;

  const placeholder = getComposePlaceholder(viewerRole);

  return (
    <div style={{ marginBottom: "16px", direction: "rtl" }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: "6px",
          border: "1px solid #bfdbfe",
          backgroundColor: expanded ? "#eff6ff" : "#ffffff",
          color: "#1e40af",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          textAlign: "center",
          transition: "background-color 0.15s ease",
        }}
      >
        {getToggleLabel(viewerRole, expanded)}
      </button>

      {expanded && (
        <div
          style={{
            marginTop: "8px",
            padding: "12px",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {notes.length === 0 && canCompose && (
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              אין הודעות קודמות. ניתן להשאיר הערה אופציונלית למטה.
            </div>
          )}

          {notes.map((entry, idx) => (
            <div
              key={`${entry.at}-${idx}`}
              style={{
                padding: "8px 10px",
                backgroundColor: "white",
                borderRadius: "4px",
                fontSize: "13px",
              }}
            >
              <div
                style={{
                  color: "#64748b",
                  fontSize: "11px",
                  marginBottom: "4px",
                }}
              >
                {entry.fromRole === UserRole.CISO ? "CISO" : "מנהל"} ({entry.from}) ·{" "}
                {getRoutingActionLabel(entry.action)} · {formatDate(entry.at)}
              </div>
              <div>{entry.notes}</div>
            </div>
          ))}

          {canCompose && (
            <div>
              <label
                htmlFor={draftNoteId}
                style={{
                  display: "block",
                  color: "#1e40af",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "6px",
                }}
              >
                {placeholder}
              </label>
              <textarea
                id={draftNoteId}
                value={draftNote}
                onChange={(e) => onDraftNoteChange?.(e.target.value)}
                rows={2}
                placeholder={placeholder}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #93c5fd",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  direction: "rtl",
                  backgroundColor: "white",
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
