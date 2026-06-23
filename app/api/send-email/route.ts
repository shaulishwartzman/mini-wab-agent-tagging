import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

export async function POST(req: Request) {
  try {
    const body: {
      email: string;
      agents: AgentCard[];
    } = await req.json();

    const { email, agents } = body;

    if (!email || !agents || !Array.isArray(agents)) {
      return NextResponse.json(
        { success: false, error: "Missing email or agents" },
        { status: 400 }
      );
    }

    const introText = `
מערכת זו מפיקה דוח משילות (AI Governance Report) עבור מערכות AI ארגוניות.
הדוח כולל סיווג רמת אוטונומיה, מודל ארכיטקטורה, יכולות מערכת, מנגנוני ניהול, 
גורמי אחריות ארגוניים ותרחישי סיכון מרכזיים.

כל סוכן מייצג מערכת AI פנימית בארגון, והסיווג נועד לסייע לצוותי אבטחת מידע, IT ו־CISO
לקבוע רמות בקרה, פיקוח וניהול סיכונים נדרשים. במקרה שיש פרטים חסרים יש להשלים על ידי הגורמים הרלוונטים.
`;

    const html = `
      <div style="font-family:Arial; direction:rtl; padding:20px; color:#111">

        <h2 style="color:#1d4ed8">דוח משילות והערכת סיכוני AI</h2>

        <pre style="background:#f1f5f9;padding:12px;border-radius:8px">
${introText}
        </pre>

        <hr/>

        <p><b>נמען:</b> ${email}</p>

        <hr/>

        ${agents
          .map((a) => {
            return `
              <div style="border:1px solid #e2e8f0;padding:16px;margin-bottom:20px;border-radius:10px">

                <h3 style="margin:0 0 10px 0;color:#0f172a">
                  ${a.agentName}
                </h3>

                <p><b>רמת סיכון כוללת:</b> ${a.agentLevel}</p>

                <h4>סיווג טכנולוגי</h4>

                <p>
                  <b>אוטונומיה:</b> ${a.classification.autonomy}<br/>
                  <span style="color:#555">${a.classificationExplanation?.autonomy || ""}</span>
                </p>

                <p>
                  <b>מודל/ארכיטקטורה:</b> ${a.classification.brain}<br/>
                  <span style="color:#555">${a.classificationExplanation?.brain || ""}</span>
                </p>

                <p>
                  <b>יכולות:</b> ${a.classification.capability}<br/>
                  <span style="color:#555">${a.classificationExplanation?.capability || ""}</span>
                </p>

                <p>
                  <b>ניהול:</b> ${a.classification.management}<br/>
                  <span style="color:#555">${a.classificationExplanation?.management || ""}</span>
                </p>

                <h4>משילות (Governance)</h4>

                <ul>
                  <li><b>Owner:</b> ${a.governance?.agentOwner || "-"}</li>
                  <li><b>Technical Owner:</b> ${a.governance?.technicalOwner || "-"}</li>
                  <li><b>Accountable:</b> ${a.governance?.accountableOwner || "-"}</li>
                  <li><b>Change Approver:</b> ${a.governance?.changeApprover || "-"}</li>
                  <li><b>Oversight:</b> ${a.governance?.oversightMechanism || "-"}</li>
                </ul>

                <h4 style="color:#b91c1c">תרחישי סיכון</h4>

                <ul>
                  ${(a.riskScenarios || [])
                    .map((r) => `<li>${r}</li>`)
                    .join("")}
                </ul>

              </div>
            `;
          })
          .join("")}

      </div>
    `;

    const result = await resend.emails.send({
      from: "noreply@leeh.info",
      to: email,
      subject: "AI Governance Report - Agent Risk Assessment",
      html,
    });

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.data?.id,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}