/**
 * Questionnaire field definitions for the agent assessment form.
 *
 * Each field may include an optional `tooltip` shown via a (?) icon on hover
 * in AgentForm (employee submit flow only). Tooltips explain what the field
 * measures and how to determine the answer for the agent being registered.
 *
 * Closed questions follow the LEEH ABCM matrix (Autonomy / Brain / Capability / Management).
 * Open `gov_*` fields capture governance accountability.
 *
 * @see components/AgentForm.tsx - Renders fields + help tooltips
 * @see components/FieldHelpTooltip.tsx - Hover (?) UI
 */

type Option = {
  option_id: string;
  label: string;
};

type FieldBase = {
  question_id: string;
  question_text: string;
  /**
   * Short Hebrew help: what the field measures + how to find out.
   * Displayed next to the question on the employee form only.
   */
  tooltip?: string;
};

type Field =
  | (FieldBase & {
      options: Option[];
      type?: never;
    })
  | (FieldBase & {
      type: "text";
      options?: never;
    });

export type { Field, Option };

export const fields: Field[] = [
  {
    question_id: "q1_autonomy",
    question_text: "רמת האוטונומיה וקבלת ההחלטות של מערכת ה-AI:",
    tooltip:
      "מה זה בוחן? עד כמה הסוכן פועל על דעת עצמו (מפעולה בודדת לפי טריגר ועד יצירת משימות ותיקון טעויות עצמאי).\nאיך לברר? בדוק מול המפתח: האם הסוכן מחכה להוראה לכל פעולה, או שהוא מקבל יעד כללי ורץ לבד?",
    options: [
      {
        option_id: "A1",
        label:
          "מבוקרת (Human-in-the-loop) – המערכת מגיבה לפקודות ישירות ומבצעת פעולה בודדת ומתוחמת בלבד.",
      },
      {
        option_id: "A2",
        label:
          "אוטונומיה חלקית (Semi-Autonomous) – המערכת מקבלת יעד כללי, מפרקת אותו לתתי-משימות ומבצעת אותן באופן עצמאי.",
      },
      {
        option_id: "A3",
        label:
          "אוטונומיה מלאה (Fully Autonomous) – המערכת מגדירה מטרות, מייצרת משימות, מתקנת את עצמה ופועלת ללא התערבות אנושית רציפה.",
      },
      {
        option_id: "U0",
        label:
          "לא ידוע כרגע / נדרש גורם רלוונטי בארגון לצורך קביעה",
      },
    ],
  },

  {
    question_id: "q2_brain",
    question_text: "ארכיטקטורת המודל וחשיפת מידע ארגוני:",
    tooltip:
      "מה זה בוחן? היכן המודל רץ ולאילו נתונים ארגוניים יש לו גישה (ענן ציבורי לעומת מודל פנימי מחובר למידע רגיש).\nאיך לברר? שאל את צוות התשתיות/פיתוח: האם משתמשים ב-API חיצוני (כמו OpenAI) או במודל שרץ על שרתי הארגון עם גישה ל-DB?",
    options: [
      {
        option_id: "B1",
        label:
          "מודל ענן ציבורי/חיצוני (Public/SaaS LLM) – המערכת מתבססת על מודל מסחרי חיצוני ללא גישה ישירה למאגרי מידע פנימיים.",
      },
      {
        option_id: "B2",
        label:
          "מודל ארגוני מוגן (Internal/RAG Enterprise) – המערכת מחוברת ישירות למאגרי המידע, הנתונים הרגישים וה-Knowledge Base של הארגון.",
      },
      {
        option_id: "B3",
        label:
          "ארכיטקטורה היברידית (Hybrid Deployment) – שילוב של מודל ארגוני פנימי עם עיבוד משלים בענן חיצוני, המצריך ניתוב נתונים מבוקר.",
      },
      {
        option_id: "U0",
        label:
          "לא ידוע כרגע / נדרש גורם רלוונטי בארגון לצורך קביעה",
      },
    ],
  },

  {
    question_id: "q3_capability",
    question_text: "רמת ההרשאות וקטורי הפעולה במערכות הארגוניות:",
    tooltip:
      "מה זה בוחן? מה הסוכן מסוגל לעשות בפועל במערכות (רק לקרוא, לכתוב ולשנות, או לכתוב קוד ותשתיות).\nאיך לברר? בדוק את הרשאות הגישה (API Keys) של הסוכן: האם הוא יכול רק לשלוף נתונים, או גם לעדכן ולמחוק?",
    options: [
      {
        option_id: "C1",
        label:
          "גישת קריאה בלבד (Read-Only) – המערכת מיועדת לתשאול, שליפת מידע והצגה, ללא יכולת ביצוע שינויים במערכות.",
      },
      {
        option_id: "C2",
        label:
          "גישת כתיבה וביצוע פעולות (Read/Write & Executable) – המערכת מחזיקה בהרשאות לביצוע פעולות אקטיביות (כגון עדכון בסיסי נתונים, שליחת הודעות, הפעלת API).",
      },
      {
        option_id: "C3",
        label:
          "יצירת והרחבת תשתיות (Code Generation & Integration) – המערכת מוסמכת לייצר קוד, לבנות אוטומציות חדשות ולשנות ארכיטקטורת מערכות.",
      },
      {
        option_id: "U0",
        label:
          "לא ידוע כרגע / נדרש גורם רלוונטי בארגון לצורך קביעה",
      },
    ],
  },

  {
    question_id: "q4_management",
    question_text: "מבנה ארגוני וממשקי עבודה של מערכת ה-AI:",
    tooltip:
      "מה זה בוחן? איך הסוכן משתלב בסביבת העבודה (סוכן בודד למשתמש, רשת סוכנים, או מנהל-על של סוכנים אחרים).\nאיך לברר? בדוק את תרשים המערכת: האם זה כלי אישי לעובד, או מערכת שמתזמרת מספר סוכנים במקביל?",
    options: [
      {
        option_id: "M1",
        label:
          "נקודתי (Isolated System) – המערכת פועלת ככלי עזר מול משתמש קצה אנושי יחיד באופן ישיר.",
      },
      {
        option_id: "M2",
        label:
          "מרובה סוכנים (Multi-Agent System) – המערכת מהווה חלק מרשת רכיבי AI מבוזרים המשתפים פעולה ומחליפים מידע ביניהם.",
      },
      {
        option_id: "M3",
        label:
          "ניהול ופיקוח (Orchestrator / Supervisor) – המערכת מנהלת, מנטרת ומקצה משימות לרכיבי AI או מערכות אוטומציה אחרות בארגון.",
      },
      {
        option_id: "U0",
        label:
          "לא ידוע כרגע / נדרש גורם רלוונטי בארגון לצורך קביעה",
      },
    ],
  },

  {
    question_id: "gov_owner",
    question_text:
      "מי המנהל הבכיר הנושא באחריות הכוללת לפעילות הסוכן? (למשל: מנהל מחלקה או ראש אגף).",
    tooltip:
      "מה זה בוחן? מי נושא באחריות העסקית (Accountability) לתוצרי הסוכן.\nאיך לברר? מי אישר את התקציב או יזם את הפרויקט ברמת ההנהלה?",
    type: "text",
  },
  {
    question_id: "gov_tech",
    question_text: "מי אחראי על השימוש והניהול הרציף של הסוכן?",
    tooltip:
      "מה זה בוחן? מי מתחזק את הסוכן ביומיום ומטפל בתקלות.\nאיך לברר? למי פונים כשהסוכן קורס או מחזיר תשובות שגויות?",
    type: "text",
  },
  {
    question_id: "gov_approver",
    question_text:
      "מי הגורם המוסמך לאשר שינויים משמעותיים בסוכן? (למשל: עדכון חוקים עסקיים או הוספת יכולות חדשות).",
    tooltip:
      "מה זה בוחן? מי מוסמך לאשר הוספת יכולות חדשות או שינוי הרשאות לסוכן.\nאיך לברר? מי חותם על שחרור גרסה חדשה (Release) של הסוכן?",
    type: "text",
  },
  {
    question_id: "gov_monitoring",
    question_text:
      "כיצד אתם תעקבו אחרי הפעילות של הסוכן בשוטף כדי לוודא שהוא עובד נכון ולא טועה? (למשל: זמני בקרה קבועים, דוחות, או התראות אוטומטיות על שגיאות).",
    tooltip:
      "מה זה בוחן? איך מוודאים שהסוכן לא \"הוזה\" (Hallucinations) או חורג מהגבולות שלו לאורך זמן.\nאיך לברר? האם יש דאשבורד בקרה? האם אדם עובר על מדגם תשובות פעם בשבוע?",
    type: "text",
  },
];
