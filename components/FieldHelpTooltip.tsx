/**
 * FieldHelpTooltip — compact (?) icon with hover help for questionnaire fields.
 *
 * Shown only on the employee submit form (AgentForm). Displays the field's
 * `tooltip` text: what the question measures and how to find the answer.
 *
 * @see components/questionnaire/fields.ts - tooltip strings per field
 * @see components/AgentForm.tsx - Parent usage
 */

"use client";

import { useState } from "react";

export type FieldHelpTooltipProps = {
  /** Help text from the field definition (supports \\n for line breaks). */
  text: string;
};

/**
 * Small circular "?" that reveals a floating tooltip on hover/focus.
 */
export function FieldHelpTooltip({ text }: FieldHelpTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="הסבר על השדה"
        aria-expanded={open}
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "1px solid #94a3b8",
          backgroundColor: "#f1f5f9",
          color: "#475569",
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1,
          cursor: "help",
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 20,
            width: 280,
            maxWidth: "min(280px, 70vw)",
            padding: "10px 12px",
            borderRadius: 8,
            backgroundColor: "#0f172a",
            color: "#f8fafc",
            fontSize: 12,
            fontWeight: 400,
            lineHeight: 1.55,
            whiteSpace: "pre-wrap",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.25)",
            textAlign: "right",
            direction: "rtl",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
