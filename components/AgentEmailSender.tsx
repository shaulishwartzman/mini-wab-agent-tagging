"use client";

import { useState, useEffect } from "react";
import { getAgents } from "@/lib/storage/agentsStorage";

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
};

export default function AgentEmailSender() {
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  // אתחול ישיר וסינכרוני של ה-State - פותר את ה-Cascading Renders בטעינה הראשונית
  const [agents, setAgents] = useState<AgentCard[]>(() => {
    if (typeof window !== "undefined") {
      return (getAgents() || []) as AgentCard[];
    }
    return [];
  });

  // פונקציית רענון הנתונים מה-Storage בעת קבלת אירוע
  const refreshAgents = () => {
    setAgents((getAgents() || []) as AgentCard[]);
  };

  useEffect(() => {
    // מאזין לאירוע עדכון מהטופס - מתעדכן בזמן אמת ללא ריפרש!
    // הסרנו מכאן את הקריאה הסינכרונית ל-refreshAgents() כדי לפתור את השגיאה
    window.addEventListener("agentsUpdated", refreshAgents);
    return () => {
      window.removeEventListener("agentsUpdated", refreshAgents);
    };
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (!email) {
      setStatus({ type: "error", message: "נא להזין כתובת מייל תקינה" });
      return;
    }
    if (selected.length === 0) {
      setStatus({ type: "error", message: "נא לבחור לפחות מערכת/מודל אחד מהרשימה" });
      return;
    }

    const selectedAgents = agents.filter((a) => selected.includes(a.id));

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          agents: selectedAgents,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setStatus({ type: "success", message: "הפורמט נשלח בהצלחה לנמען!" });
        setEmail("");
        setSelected([]);
      } else {
        setStatus({ type: "error", message: "שגיאה בשליחת המייל. נא לנסות שנית." });
      }
    } catch (error) {
      setStatus({ type: "error", message: "חיבור השרת נכשל." });
    }
  };

  const theme = {
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    cardBg: "#ffffff",
    textMain: "#1e293b",
    textMuted: "#475569",
    border: "#e2e8f0",
    danger: "#dc2626",
    success: "#16a34a",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }} dir="rtl">
      <div style={{ 
        width: "100%", 
        maxWidth: 900, 
        margin: "0 auto", 
        padding: 30, 
        backgroundColor: theme.cardBg, 
        border: `1px solid ${theme.border}`, 
        borderRadius: 16, 
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        boxSizing: "border-box"
      }}>
        
        {/* כותרת והסבר פונקציונלי למנהל אבטחת מידע */}
        <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: 20, marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 8px 0", color: theme.textMain, fontSize: 20, fontWeight: 700 }}>
            שיתוף הערכת סוכנים לאישור (AI Governance)
          </h2>
          <p style={{ margin: 0, color: theme.textMuted, fontSize: 14, lineHeight: 1.5 }}>
            מערכת זו מאפשרת לצוות אבטחת המידע וה-CISO למפות ולאשר מערכות AI בארגון. 
            באפשרותך לשלוח את ההערכה לעובדים המעורבים במשילות או בפיתוח הסוכן, או להפיץ אותה ישירות לגורמי אבטחת המידע לצורך קבלת אישור להפעלת הסוכן ושימושו בארגון.
          </p>
        </div>

        {/* הזנת אימייל נמען */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: theme.textMain }}>
            כתובת אימייל של הנמען בארגון:
          </label>
          <input
            type="email"
            placeholder="username@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              backgroundColor: "#f1f5f9",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
              direction: "ltr",
              textAlign: "left",
              color: theme.textMain
            }}
          />
        </div>

        {/* רשימת המודלים / סוכנים לבחירה */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "inline-block", fontSize: 14, fontWeight: 600, color: theme.textMain, marginBottom: 12 }}>
            בחר את הסוכנים להצמדה ושליחה:
          </label>
          
          {agents.length === 0 ? (
            <p style={{ color: theme.textMuted, fontStyle: "italic", textAlign: "center", padding: 20, backgroundColor: "#f8fafc", borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: 14 }}>
              לא נמצאו מערכות רשומות במאגר כרגע.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {agents.map((a) => {
                const isChecked = selected.includes(a.id);
                return (
                  <label key={a.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 16,
                    borderRadius: 12,
                    border: isChecked ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
                    backgroundColor: isChecked ? "#eff6ff" : theme.cardBg,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(a.id)}
                      style={{ cursor: "pointer", accentColor: theme.primary, width: 16, height: 16 }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: theme.textMain }}>
                        {a.agentName || "מערכת ללא שם"}
                      </span>
                      <span style={{ fontSize: 12, color: theme.textMuted }}>
                        רמת סיכון: {a.agentLevel || "לא נקבע"}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {status.type && (
          <div style={{ padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 500, marginBottom: 16, border: "1px solid", backgroundColor: status.type === "success" ? "#f0fdf4" : "#fef2f2", borderColor: status.type === "success" ? "#bbf7d0" : "#fca5a5", color: status.type === "success" ? theme.success : theme.danger }}>
            {status.message}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <button onClick={handleSend} style={{ backgroundColor: theme.primary, color: "#fff", border: "none", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.primaryHover)}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = theme.primary)}
          >
            שלח שאלון משילות במייל
          </button>
        </div>
      </div>

      {/* פוטר (Footer) קבוע ומעודכן לחלוטין בתחתית העמוד */}
      <footer style={{
        backgroundColor: "#0f172a",
        color: "#94a3b8",
        padding: "24px 20px",
        textAlign: "center",
        fontSize: 13,
        lineHeight: 1.6,
        width: "100%"
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
          <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 14 }}>
            נבנה על ידי <span style={{ color: "#38bdf8" }}>LEEH</span> &copy; {new Date().getFullYear()}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
            <span>ליצירת קשר ותמיכה: <strong>Shauli Shwartzman</strong></span>
            <span>|</span>
            <span><a href="mailto:shauli.sh321@gmail.com" style={{ color: "#38bdf8", textDecoration: "none" }}>shauli.sh321@gmail.com</a></span>
          </div>
        </div>
      </footer>
    </div>
  );
}