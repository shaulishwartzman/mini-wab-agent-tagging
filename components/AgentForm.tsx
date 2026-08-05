"use client";

/**
 * Agent assessment form component.
 *
 * Collects questionnaire answers, generates a governance/risk card via
 * createAgentCard, and persists to MongoDB via /api/requests.
 */

import { useState, useEffect, useCallback } from "react";
import { fields } from "@/components/questionnaire/fields";
import { createAgentCard } from "@/lib/agent-engine/createAgentCard";
import {
  createRequest,
  fetchRequests,
  deleteRequest,
  type AgentRequestResponse,
} from "@/lib/api/requests";
import type { AgentCard } from "@/lib/types";

const theme = {
  primary: "#2563eb",
  primaryHover: "#1d4ed8",
  bg: "#f8fafc",
  cardBg: "#ffffff",
  textMain: "#1e293b",
  textMuted: "#475569",
  border: "#e2e8f0",
  danger: "#dc2626",
  success: "#16a34a",
  infoBg: "#f1f5f9",
  accentDark: "#1e293b",
  accentLight: "#f8fafc",
};

/** Map API response to UI card shape. */
function toAgentCard(res: AgentRequestResponse): AgentCard {
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

const getReadableAnswer = (fieldId: string, optionId: string) => {
  const field = fields.find((f) => f.question_id === fieldId);
  const option = field?.options?.find((o) => o.option_id === optionId);
  return option ? option.label : optionId;
};

/** Renders a governance/risk card with optional dark theme. */
function RenderPrettyCard({
  card,
  isDark = false,
}: {
  card: AgentCard;
  isDark?: boolean;
}) {
  const textColor = isDark ? "#f8fafc" : theme.textMain;
  const subTextColor = isDark ? "#94a3b8" : theme.textMuted;
  const sectionBorder = isDark
    ? "1px solid #334155"
    : `1px solid ${theme.border}`;

  return (
    <div
      style={{
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        color: textColor,
        padding: 24,
        borderRadius: 14,
        border: isDark ? "1px solid #334155" : `1px solid ${theme.border}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        display: "grid",
        gap: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: sectionBorder,
          paddingBottom: 14,
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700 }}>{card.agentName}</span>
        <span
          style={{
            backgroundColor:
              card.agentLevel?.includes("גבוה") ||
              card.agentLevel?.includes("High")
                ? "#fee2e2"
                : "#dcfce7",
            color:
              card.agentLevel?.includes("גבוה") ||
              card.agentLevel?.includes("High")
                ? "#ef4444"
                : "#16a34a",
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          רמת סיכון: {card.agentLevel}
        </span>
      </div>

      <div>
        <h4
          style={{
            margin: "0 0 10px 0",
            fontSize: 15,
            fontWeight: 700,
            color: isDark ? "#38bdf8" : theme.primary,
          }}
        >
          🤖 ארכיטקטורה וסיווג טכנולוגי
        </h4>
        <div style={{ display: "grid", gap: 8, fontSize: 14, paddingRight: 4 }}>
          <div>
            <strong>אוטונומיה וקבלת החלטות:</strong>{" "}
            <span style={{ color: subTextColor }}>
              {getReadableAnswer("q1_autonomy", card.classification.autonomy)}
            </span>
          </div>
          <div>
            <strong>ארכיטקטורה וחשיפת מידע:</strong>{" "}
            <span style={{ color: subTextColor }}>
              {getReadableAnswer("q2_brain", card.classification.brain)}
            </span>
          </div>
          <div>
            <strong>וקטורי פעולה והרשאות:</strong>{" "}
            <span style={{ color: subTextColor }}>
              {getReadableAnswer("q3_capability", card.classification.capability)}
            </span>
          </div>
          <div>
            <strong>ממשקי עבודה וניהול:</strong>{" "}
            <span style={{ color: subTextColor }}>
              {getReadableAnswer("q4_management", card.classification.management)}
            </span>
          </div>
        </div>
      </div>

      {card.governance && (
        <div style={{ borderTop: sectionBorder, paddingTop: 16 }}>
          <h4
            style={{
              margin: "0 0 10px 0",
              fontSize: 15,
              fontWeight: 700,
              color: isDark ? "#38bdf8" : theme.primary,
            }}
          >
            👥 מודל משילות וגורמים אחראיים (Governance)
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 10,
              fontSize: 13,
              paddingRight: 4,
            }}
          >
            <div>
              <strong>המנהל הבכיר הנושא באחריות:</strong>{" "}
              <span style={{ color: subTextColor }}>
                {card.governance.agentOwner || "למילוי על ידי הגורם הרלוונטי"}
              </span>
            </div>
            <div>
              <strong>מפעיל הסוכן:</strong>{" "}
              <span style={{ color: subTextColor }}>
                {card.governance.technicalOwner ||
                  "למילוי על ידי הגורם הרלוונטי"}
              </span>
            </div>
            <div>
              <strong>גורם מאשר שינויים:</strong>{" "}
              <span style={{ color: subTextColor }}>
                {card.governance.changeApprover ||
                  "למילוי על ידי הגורם הרלוונטי"}
              </span>
            </div>
            <div>
              <strong>מנגנון פיקוח מוגדר:</strong>{" "}
              <span style={{ color: subTextColor }}>
                {card.governance.oversightMechanism ||
                  "למילוי על ידי הגורם הרלוונטי"}
              </span>
            </div>
          </div>
        </div>
      )}

      {card.riskScenarios && card.riskScenarios.length > 0 && (
        <div style={{ borderTop: sectionBorder, paddingTop: 16 }}>
          <h4
            style={{
              margin: "0 0 10px 0",
              fontSize: 15,
              fontWeight: 700,
              color: "#f43f5e",
            }}
          >
            ⚠️ תרחישי סיכון ממופים
          </h4>
          <ul
            style={{
              margin: 0,
              paddingRight: 20,
              fontSize: 13,
              color: subTextColor,
              lineHeight: 1.6,
            }}
          >
            {card.riskScenarios.map((risk, index) => (
              <li key={index} style={{ marginBottom: 4 }}>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AgentForm() {
  const [agentName, setAgentName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AgentCard | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  );

  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /** Load agents from MongoDB on mount. */
  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchRequests();
    if (res.success && res.requests) {
      setAgents(res.requests.map(toAgentCard));
    } else {
      setError(res.error || "Failed to load agents");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleChange = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /** Submit form: create card, POST to API, refresh list. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const card = createAgentCard({
      agentName,
      answers,
      fields,
    });

    const res = await createRequest({
      agentName: card.agentName,
      answers,
      classification: card.classification,
      agentLevel: card.agentLevel,
      classificationExplanation: card.classificationExplanation,
      governance: card.governance,
      riskScenarios: card.riskScenarios,
    });

    if (res.success && res.request) {
      setResult(toAgentCard(res.request));
      setSuccessMsg("הבקשה נשמרה בהצלחה במסד הנתונים");
      await loadAgents();
      setAgentName("");
      setAnswers({});
    } else {
      setError(res.error || "Failed to save request");
    }
    setSubmitting(false);
  };

  /** Delete agent from MongoDB. */
  const handleDelete = async (id: string) => {
    const res = await deleteRequest(id);
    if (res.success) {
      setAgents((prev) => prev.filter((a) => a.id !== id));
      if (result?.id === id) setResult(null);
    } else {
      setError(res.error || "Failed to delete");
    }
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "20px 0",
        width: "100%",
        boxSizing: "border-box",
      }}
      dir="rtl"
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: 24,
          backgroundColor: theme.cardBg,
          padding: 30,
          borderRadius: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: `1px solid ${theme.border}`,
          marginBottom: 32,
        }}
      >
        <div>
          <h2
            style={{
              margin: "0 0 8px 0",
              color: theme.textMain,
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            טופס בקשה להפעלת סוכן AI
          </h2>
          <p
            style={{
              margin: 0,
              color: theme.textMuted,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            טופס זה מיועד להערכת סוכנים חכמים (AI Agents) ולקבלת אישור הפעלה
            מסודר בארגון. יש למלא את פרטי הסוכן. לאחר השלמת הטופס יופק כרטיס
            משילות וסיכונים לצורך בחינת הסיכון ואישור הפעלת הסוכן בארגון על ידי
            ה-CISO או צוות אבטחת המידע.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label
            style={{ fontSize: 14, fontWeight: 600, color: theme.textMain }}
          >
            שם מערכת ה-AI / הסוכן הנבדק:
          </label>
          <input
            placeholder="לדוגמה: מערכת תמלול פניות לקוחות, בוט פיתוח פנימי..."
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              backgroundColor: "#f1f5f9",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
              color: theme.textMain,
              textAlign: "right",
            }}
          />
        </div>

        {fields.map((q) => (
          <div
            key={q.question_id}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: theme.textMain,
              }}
            >
              {q.question_text}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 12,
              }}
            >
              {(q.type || "").toLowerCase().trim() === "text" ? (
                <input
                  type="text"
                  value={answers[q.question_id] || ""}
                  onChange={(e) => handleChange(q.question_id, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: `1px solid ${theme.border}`,
                    fontSize: 13,
                    textAlign: "right",
                  }}
                />
              ) : (
                q.options?.map((opt) => {
                  const isSelected = answers[q.question_id] === opt.option_id;
                  return (
                    <label
                      key={opt.option_id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: 16,
                        borderRadius: 10,
                        border: isSelected
                          ? `2px solid ${theme.primary}`
                          : `1px solid ${theme.border}`,
                        backgroundColor: isSelected ? "#eff6ff" : theme.cardBg,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <input
                        type="radio"
                        name={q.question_id}
                        checked={isSelected}
                        onChange={() => handleChange(q.question_id, opt.option_id)}
                        style={{
                          marginTop: 3,
                          cursor: "pointer",
                          accentColor: theme.primary,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          color: isSelected ? "#1e40af" : theme.textMuted,
                          lineHeight: 1.4,
                          fontWeight: isSelected ? 500 : 400,
                        }}
                      >
                        {opt.label}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        ))}

        {/* Feedback messages */}
        {error && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              color: theme.danger,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
        {successMsg && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: theme.success,
              fontSize: 14,
            }}
          >
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            backgroundColor: submitting ? "#93c5fd" : theme.primary,
            color: "#fff",
            border: "none",
            padding: "14px 24px",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
          }}
        >
          {submitting ? "שומר..." : "שמור בקשה (פנים ארגונית)"}
        </button>
      </form>

      {result && (
        <div style={{ marginBottom: 40 }}>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: theme.textMain,
              marginBottom: 12,
            }}
          >
            כרטיס אבטחה ומשילות שהופק כעת:
          </h3>
          <RenderPrettyCard card={result} isDark={true} />
        </div>
      )}

      <div style={{ marginBottom: 40 }}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: theme.textMain,
            marginBottom: 16,
          }}
        >
          הסוכנים שלך במאגר ({agents.length})
        </h3>

        {loading ? (
          <p
            style={{
              color: theme.textMuted,
              textAlign: "center",
              padding: 24,
              backgroundColor: theme.cardBg,
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
            }}
          >
            טוען...
          </p>
        ) : agents.length === 0 ? (
          <p
            style={{
              color: theme.textMuted,
              fontStyle: "italic",
              textAlign: "center",
              padding: 24,
              backgroundColor: theme.cardBg,
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
            }}
          >
            טרם מופו מערכות AI בארגון.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
              gap: 16,
            }}
          >
            {agents.map((a) => {
              const isExpanded = !!expandedCards[a.id];
              return (
                <div
                  key={a.id}
                  style={{
                    backgroundColor: theme.cardBg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          color: theme.textMain,
                          fontSize: 16,
                          fontWeight: 600,
                        }}
                      >
                        {a.agentName}
                      </h4>
                      <span
                        style={{
                          backgroundColor:
                            a.agentLevel?.includes("גבוה") ||
                            a.agentLevel?.includes("High")
                              ? "#fee2e2"
                              : "#dcfce7",
                          color:
                            a.agentLevel?.includes("גבוה") ||
                            a.agentLevel?.includes("High")
                              ? "#ef4444"
                              : "#16a34a",
                          padding: "3px 8px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {a.agentLevel}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div
                      style={{
                        borderTop: `1px solid ${theme.border}`,
                        paddingTop: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <RenderPrettyCard card={a} isDark={false} />
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => toggleExpand(a.id)}
                      style={{
                        flex: 1,
                        backgroundColor: "#f1f5f9",
                        color: theme.textMain,
                        border: "none",
                        padding: "8px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {isExpanded ? "הסתר פרטים" : "הצג פירוט מלא"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      style={{
                        backgroundColor: "transparent",
                        color: theme.danger,
                        border: `1px solid ${theme.danger}`,
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      מחק
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
