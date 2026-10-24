/**
 * RequestAnswersPanel — read-only questionnaire answers for request review.
 *
 * Entire Q&A block (closed options + free-text governance fields) is hidden
 * behind a toggle so the card stays compact until the reviewer expands it.
 *
 * Labels:
 * - ▼ תשובות השאלון — expand
 * - ▲ הסתר תשובות השאלון — collapse
 *
 * Free-text is displayed as raw text from MongoDB (read-only).
 *
 * @see lib/utils/requestHelpers.ts - getQuestionnaireAnswerRows()
 * @see components/RequestQueue.tsx - Parent expand panel
 */

"use client";

import { useState } from "react";
import {
  getQuestionnaireAnswerRows,
  type QuestionnaireAnswerRow,
} from "@/lib/utils/requestHelpers";

export type RequestAnswersPanelProps = {
  /** Raw answers map from the AgentRequest document. */
  answers: Record<string, string> | undefined;
};

/**
 * Renders one Q&A row (read-only).
 */
function AnswerRow({ row }: { row: QuestionnaireAnswerRow }) {
  return (
    <div
      style={{
        paddingBottom: "12px",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "#64748b",
          marginBottom: "4px",
        }}
      >
        {row.questionText}
        {row.isFreeText && (
          <span
            style={{
              marginRight: "8px",
              fontSize: "11px",
              fontWeight: 500,
              color: "#94a3b8",
            }}
          >
            (שדה חופשי)
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: "14px",
          color: "#1e293b",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
        }}
      >
        {row.answerDisplay}
      </div>
    </div>
  );
}

/**
 * Read-only questionnaire panel — all answers behind one expand toggle.
 */
export function RequestAnswersPanel({ answers }: RequestAnswersPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const rows = getQuestionnaireAnswerRows(answers);

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
          border: "1px solid #cbd5e1",
          backgroundColor: expanded ? "#f1f5f9" : "#ffffff",
          color: "#334155",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          textAlign: "center",
          transition: "background-color 0.15s ease",
        }}
      >
        {expanded
          ? "▲ הסתר תשובות השאלון"
          : "▼ תשובות השאלון (קריאה בלבד)"}
      </button>

      {expanded && (
        <div
          style={{
            marginTop: "8px",
            padding: "16px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            display: "grid",
            gap: "12px",
          }}
        >
          {rows.map((row) => (
            <AnswerRow key={row.questionId} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
