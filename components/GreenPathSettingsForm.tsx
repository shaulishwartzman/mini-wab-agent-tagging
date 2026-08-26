/**
 * GreenPathSettingsForm — CISO UI to edit allowed green-path answers.
 *
 * Four checkbox groups (A/B/C/M). U0 is never shown.
 * Save → PUT /api/green-path-settings
 * Reset → restore A1/B1/C1/M1 defaults and save
 *
 * @see app/green-path/page.tsx
 * @see lib/api/greenPathSettings.ts
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { fields } from "@/components/questionnaire/fields";
import { useRole } from "@/contexts/RoleContext";
import { UserRole } from "@/lib/types";
import {
  DISQUALIFYING_ANSWER,
  GREEN_PATH_QUESTION_IDS,
  GREEN_PATH_SECTION_TITLES,
  getDefaultAllowedAnswers,
  type AllowedAnswersMap,
  type GreenPathQuestionId,
} from "@/lib/auto-approval/greenPathCriteria";
import {
  fetchGreenPathSettings,
  resetGreenPathSettings,
  saveGreenPathSettings,
} from "@/lib/api/greenPathSettings";

/** Closed-question options for the settings form (excludes U0). */
function getCheckboxOptions(questionId: GreenPathQuestionId) {
  const field = fields.find((f) => f.question_id === questionId);
  return (field?.options ?? []).filter(
    (o) => o.option_id !== DISQUALIFYING_ANSWER
  );
}

/**
 * Shorten long questionnaire labels for checkbox display.
 */
function shortLabel(optionId: string, fullLabel: string): string {
  const dash = fullLabel.indexOf("–");
  const head = dash > 0 ? fullLabel.slice(0, dash).trim() : fullLabel;
  return `${optionId} — ${head}`;
}

export function GreenPathSettingsForm() {
  const { data: session } = useSession();
  const { currentUser: roleContextUser } = useRole();
  const actor = useMemo(() => {
    if (session?.user?.role === UserRole.SYSTEM_ADMIN) {
      return { role: roleContextUser.role, id: roleContextUser.id };
    }
    return {
      role: (session?.user?.role ?? "") as (typeof UserRole)[keyof typeof UserRole],
      id: session?.user?.id ?? "",
    };
  }, [session, roleContextUser]);
  const [allowedAnswers, setAllowedAnswers] = useState<AllowedAnswersMap>(
    getDefaultAllowedAnswers()
  );
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchGreenPathSettings();
    if (res.success && res.settings) {
      setAllowedAnswers(res.settings.allowedAnswers);
      setEnabled(res.settings.enabled !== false);
    } else {
      setAllowedAnswers(getDefaultAllowedAnswers());
      setEnabled(true);
      if (res.error) setError(res.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleOption = (questionId: GreenPathQuestionId, optionId: string) => {
    setAllowedAnswers((prev) => {
      const current = prev[questionId] ?? [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [questionId]: next };
    });
    setSuccessMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    for (const qId of GREEN_PATH_QUESTION_IDS) {
      if (!allowedAnswers[qId]?.length) {
        setError(`יש לבחור לפחות אפשרות אחת ב״${GREEN_PATH_SECTION_TITLES[qId]}״`);
        setSaving(false);
        return;
      }
    }

    const res = await saveGreenPathSettings(
      allowedAnswers,
      actor.role,
      actor.id,
      enabled
    );

    if (res.success && res.settings) {
      setAllowedAnswers(res.settings.allowedAnswers);
      setEnabled(res.settings.enabled !== false);
      setSuccessMsg(
        res.settings.enabled === false
          ? "הנתיב הירוק כובה — אין אישור אוטומטי"
          : "ההגדרות נשמרו בהצלחה"
      );
    } else {
      setError(res.error || "שמירה נכשלה");
    }
    setSaving(false);
  };

  const handleReset = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const res = await resetGreenPathSettings(actor.role, actor.id);
    if (res.success && res.settings) {
      setAllowedAnswers(res.settings.allowedAnswers);
      setEnabled(res.settings.enabled !== false);
      setSuccessMsg("הוחזר לברירת המחדל (נתיב ירוק פעיל, A1 / B1 / C1 / M1)");
    } else {
      setError(res.error || "איפוס נכשל");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: "#64748b", textAlign: "center" }}>
        טוען הגדרות...
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      style={{
        display: "grid",
        gap: 28,
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: 16,
          borderRadius: 10,
          border: enabled ? "2px solid #22c55e" : "2px solid #fca5a5",
          backgroundColor: enabled ? "#f0fdf4" : "#fef2f2",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            setSuccessMsg(null);
          }}
          style={{ marginTop: 3, width: 18, height: 18, accentColor: "#16a34a" }}
        />
        <span>
          <span
            style={{
              display: "block",
              fontSize: 15,
              fontWeight: 700,
              color: enabled ? "#166534" : "#991b1b",
              marginBottom: 4,
            }}
          >
            {enabled
              ? "אישור אוטומטי פעיל (נתיב ירוק)"
              : "אישור אוטומטי כבוי"}
          </span>
          <span style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
            {enabled
              ? "בקשות שעומדות בקריטריונים למטה יאושרו אוטומטית ללא טיפול CISO."
              : "כל הבקשות יועברו לאישור CISO. אין אישור אוטומטי."}
          </span>
        </span>
      </label>

      <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
        בחר אילו תשובות סגורות מאפשרות אישור אוטומטי (נתיב ירוק). תשובת ״לא
        ידוע״ תמיד פוסלת אישור אוטומטי. פירוט ייעוד הסוכן ושדות ממשל חופשיים
        נשארים חובה כברירת מחדל.
      </p>

      <div style={{ opacity: enabled ? 1 : 0.45, pointerEvents: enabled ? "auto" : "none" }}>

      {GREEN_PATH_QUESTION_IDS.map((questionId) => (
        <section key={questionId}>
          <h3
            style={{
              margin: "0 0 12px 0",
              fontSize: 16,
              fontWeight: 700,
              color: "#1e293b",
            }}
          >
            {GREEN_PATH_SECTION_TITLES[questionId]}
          </h3>
          <div style={{ display: "grid", gap: 8 }}>
            {getCheckboxOptions(questionId).map((opt) => {
              const checked = allowedAnswers[questionId]?.includes(
                opt.option_id
              );
              const isDefault =
                getDefaultAllowedAnswers()[questionId][0] === opt.option_id;
              return (
                <label
                  key={opt.option_id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: checked
                      ? "2px solid #2563eb"
                      : "1px solid #e2e8f0",
                    backgroundColor: checked ? "#eff6ff" : "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={() => toggleOption(questionId, opt.option_id)}
                    style={{ marginTop: 3, accentColor: "#2563eb" }}
                  />
                  <span style={{ fontSize: 13, color: "#334155", lineHeight: 1.4 }}>
                    {shortLabel(opt.option_id, opt.label)}
                    {isDefault && (
                      <span style={{ color: "#94a3b8", marginRight: 6 }}>
                        (ברירת מחדל)
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      ))}

      </div>

      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: "#fef2f2",
            border: "1px solid #fca5a5",
            color: "#dc2626",
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
            color: "#16a34a",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            border: "none",
            backgroundColor: saving ? "#93c5fd" : "#2563eb",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "שומר..." : "שמור שינויים"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            backgroundColor: "#ffffff",
            color: "#334155",
            fontWeight: 600,
            fontSize: 14,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          אפס לברירת מחדל
        </button>
      </div>
    </div>
  );
}
