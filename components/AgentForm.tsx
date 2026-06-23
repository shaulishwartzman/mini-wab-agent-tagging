"use client";

import { useState, useEffect } from "react";
import { fields } from "@/components/questionnaire/fields";
import { createAgentCard } from "@/lib/agent-engine/createAgentCard";
import {
  getAgents,
  saveAgent,
  deleteAgent,
} from "@/lib/storage/agentsStorage";

type AgentCard = {
  id: string;
  agentName: string;
  agentLevel: string;
  classification: {
    autonomy: string;
    brain: string;
    capability: string;
    management: string;
  };
  classificationExplanation: Record<string, string>;
  governance: {
    agentOwner: string;
    technicalOwner: string;
    accountableOwner: string;
    changeApprover: string;
    oversightMechanism: string;
    oversightOwner: string;
  };
  riskScenarios: string[];
};

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
  accentLight: "#f8fafc"
};

const getReadableAnswer = (fieldId: string, optionId: string) => {
  const field = fields.find(f => f.question_id === fieldId);
  const option = field?.options.find(o => o.option_id === optionId);
  return option ? option.label : optionId;
};

// רכיב כרטיס משודרג הכולל כעת Governance ותרחישי סיכון אוטומטיים
function RenderPrettyCard({ card, isDark = false }: { card: AgentCard, isDark?: boolean }) {
  const textColor = isDark ? "#f8fafc" : theme.textMain;
  const subTextColor = isDark ? "#94a3b8" : theme.textMuted;
  const sectionBorder = isDark ? "1px solid #334155" : `1px solid ${theme.border}`;

  return (
    <div style={{
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      color: textColor,
      padding: 24,
      borderRadius: 14,
      border: isDark ? "1px solid #334155" : `1px solid ${theme.border}`,
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      display: "grid",
      gap: 20
    }}>
      {/* כותרת ורמת סיכון */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: sectionBorder, paddingBottom: 14 }}>
        <span style={{ fontSize: 18, fontWeight: 700 }}>{card.agentName}</span>
        <span style={{ 
          backgroundColor: card.agentLevel?.includes("גבוה") || card.agentLevel?.includes("High") ? "#fee2e2" : "#dcfce7", 
          color: card.agentLevel?.includes("גבוה") || card.agentLevel?.includes("High") ? "#ef4444" : "#16a34a",
          padding: "6px 14px", 
          borderRadius: 20, 
          fontSize: 13, 
          fontWeight: 600 
        }}>
          רמת סיכון: {card.agentLevel}
        </span>
      </div>

      {/* חלק 1: ארכיטקטורה וסיווג טכנולוגי */}
      <div>
        <h4 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 700, color: isDark ? "#38bdf8" : theme.primary }}>🤖 ארכיטקטורה וסיווג טכנולוגי</h4>
        <div style={{ display: "grid", gap: 8, fontSize: 14, paddingRight: 4 }}>
          <div><strong>אוטונומיה וקבלת החלטות:</strong> <span style={{ color: subTextColor }}>{getReadableAnswer("q1_autonomy", card.classification.autonomy)}</span></div>
          <div><strong>ארכיטקטורה וחשיפת מידע:</strong> <span style={{ color: subTextColor }}>{getReadableAnswer("q2_brain", card.classification.brain)}</span></div>
          <div><strong>וקטורי פעולה והרשאות:</strong> <span style={{ color: subTextColor }}>{getReadableAnswer("q3_capability", card.classification.capability)}</span></div>
          <div><strong>ממשקי עבודה וניהול:</strong> <span style={{ color: subTextColor }}>{getReadableAnswer("q4_management", card.classification.management)}</span></div>
        </div>
      </div>

      {/* חלק 2: מודל משילות ומחזיקי עניין (Governance) */}
      {card.governance && (
        <div style={{ borderTop: sectionBorder, paddingTop: 16 }}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 700, color: isDark ? "#38bdf8" : theme.primary }}>👥 מודל משילות וגורמים אחראיים (Governance)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, fontSize: 13, paddingRight: 4 }}>
            <div><strong>מנהל עסקי (Owner):</strong> <span style={{ color: subTextColor }}>{card.governance.agentOwner || "למילוי על ידי הגורם הרלוונטי"}</span></div>
            <div><strong>מוביל טכנולוגי:</strong> <span style={{ color: subTextColor }}>{card.governance.technicalOwner || "למילוי על ידי הגורם הרלוונטי"}</span></div>
            <div><strong>גורם מאשר שינויים:</strong> <span style={{ color: subTextColor }}>{card.governance.changeApprover || "למילוי על ידי הגורם הרלוונטי"}</span></div>
            <div><strong>מנגנון פיקוח מוגדר:</strong> <span style={{ color: subTextColor }}>{card.governance.oversightMechanism || "למילוי על ידי הגורם הרלוונטי"}</span></div>
          </div>
        </div>
      )}

      {/* חלק 3: תרחישי סיכון מחושבים אוטומטית */}
      {card.riskScenarios && card.riskScenarios.length > 0 && (
        <div style={{ borderTop: sectionBorder, paddingTop: 16 }}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 700, color: "#f43f5e" }}>⚠️ תרחישי סיכון ממופים </h4>
          <ul style={{ margin: 0, paddingRight: 20, fontSize: 13, color: subTextColor, lineHeight: 1.6 }}>
            {card.riskScenarios.map((risk, index) => (
              <li key={index} style={{ marginBottom: 4 }}>{risk}</li>
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
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const [agents, setAgents] = useState<AgentCard[]>(() => {
    if (typeof window !== "undefined") {
      return getAgents() || [];
    }
    return [];
  });

  const handleChange = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const card = createAgentCard({
      agentName,
      answers,
      fields,
    }) as AgentCard;

    saveAgent(card);

    const updated = getAgents();
    setAgents([...updated]);
    setResult(card);

    window.dispatchEvent(new Event("agentsUpdated"));

    setAgentName("");
    setAnswers({});
  };

  const handleDelete = (id: string) => {
    deleteAgent(id);
    const updated = getAgents();
    setAgents([...updated]);
    if (result?.id === id) setResult(null);
    
    window.dispatchEvent(new Event("agentsUpdated"));
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 0", width: "100%", boxSizing: "border-box" }} dir="rtl">
      
      {/* טופס הערכת סיכונים ומערכות */}
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 24, backgroundColor: theme.cardBg, padding: 30, borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: `1px solid ${theme.border}`, marginBottom: 32 }}>
        <div>
          <h2 style={{ margin: "0 0 8px 0", color: theme.textMain, fontSize: 24, fontWeight: 700 }}>
            מבדק משילות והערכת סיכוני AI בארגון
          </h2>
          <p style={{ margin: 0, color: theme.textMuted, fontSize: 14, lineHeight: 1.5 }}>
            מלא את פרטי המערכת או המודל שלהלן כדי לקבל דוח משילות (Governance Mapping), סיווג רמת סיכון וקביעת מנגנוני פיקוח נדרשים.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: theme.textMain }}>שם מערכת ה-AI / המודל הנבדק:</label>
          <input
            placeholder="לדוגמה: מערכת תמלול פניות לקוחות, בוט פיתוח פנימי וכדומה..."
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
              color: theme.textMain
            }}
          />
        </div>

        {fields.map((q) => (
          <div key={q.question_id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme.textMain }}>
              {q.question_text}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              {q.options.map((opt) => {
                const isSelected = answers[q.question_id] === opt.option_id;
                return (
                  <label key={opt.option_id} style={{ 
                    display: "flex", 
                    alignItems: "flex-start", 
                    gap: 10,
                    padding: 16,
                    borderRadius: 10,
                    border: isSelected ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
                    backgroundColor: isSelected ? "#eff6ff" : theme.cardBg,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}>
                    <input
                      type="radio"
                      name={q.question_id}
                      checked={isSelected}
                      onChange={() => handleChange(q.question_id, opt.option_id)}
                      style={{ marginTop: 3, cursor: "pointer", accentColor: theme.primary }}
                    />
                    <span style={{ fontSize: 13, color: isSelected ? "#1e40af" : theme.textMuted, lineHeight: 1.4, fontWeight: isSelected ? 500 : 400 }}>
                      {opt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <button type="submit" style={{ backgroundColor: theme.primary, color: "#fff", border: "none", padding: "14px 24px", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          הפק כרטיס משילות וסיכונים
        </button>
      </form>

      {/* הצגת תוצאה אחרונה שהופקה בצורה יפה ומקיפה */}
      {result && (
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.textMain, marginBottom: 12 }}>כרטיס אבטחה ומשילות שהופק כעת:</h3>
          <RenderPrettyCard card={result} isDark={true} />
        </div>
      )}

      {/* רשימת מערכות שמורות בארגון - פריסה רוחבית מתרחבת */}
      <div style={{ marginBottom: 40 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.textMain, marginBottom: 16 }}>
          מערכות ומודלים ממופים במאגר הארגוני ({agents.length})
        </h3>

        {agents.length === 0 ? (
          <p style={{ color: theme.textMuted, fontStyle: "italic", textAlign: "center", padding: 24, backgroundColor: theme.cardBg, borderRadius: 8, border: `1px solid ${theme.border}` }}>
            טרם מופו מערכות AI בארגון.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 16 }}>
            {agents.map((a) => {
              const isExpanded = !!expandedCards[a.id];
              return (
                <div key={a.id} style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 12, justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <h4 style={{ margin: 0, color: theme.textMain, fontSize: 16, fontWeight: 600 }}>{a.agentName}</h4>
                      <span style={{ 
                        backgroundColor: a.agentLevel?.includes("גבוה") || a.agentLevel?.includes("High") ? "#fee2e2" : "#dcfce7", 
                        color: a.agentLevel?.includes("גבוה") || a.agentLevel?.includes("High") ? "#ef4444" : "#16a34a",
                        padding: "3px 8px", 
                        borderRadius: 12, 
                        fontSize: 11, 
                        fontWeight: 600 
                      }}>
                        {a.agentLevel}
                      </span>
                    </div>
                  </div>

                  {/* פירוט מלא נפתח בלחיצה - כולל Governance וסיכונים */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                      <RenderPrettyCard card={a} isDark={false} />
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button 
                      type="button"
                      onClick={() => toggleExpand(a.id)}
                      style={{ flex: 1, backgroundColor: "#f1f5f9", color: theme.textMain, border: "none", padding: "8px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                    >
                      {isExpanded ? "הסתר פרטים" : "הצג פירוט מלא"}
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      style={{ backgroundColor: "transparent", color: theme.danger, border: `1px solid ${theme.danger}`, padding: "8px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer" }}
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