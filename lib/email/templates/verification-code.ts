/**
 * Email template for password reset verification code.
 * Bilingual (Hebrew RTL + English LTR) with responsive design.
 */

export interface VerificationCodeEmailParams {
  name: string;
  organizationName: string;
  verificationCode: string;
}

export function verificationCodeEmailTemplate(
  params: VerificationCodeEmailParams
): string {
  const { name, organizationName, verificationCode } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 2px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1e293b;">
                🔐 קוד אימות לאיפוס סיסמה
              </h1>
              <p style="margin: 8px 0 0; font-size: 18px; color: #64748b;">
                Password Reset Verification Code
              </p>
            </td>
          </tr>

          <!-- Hebrew Content (RTL) -->
          <tr>
            <td style="padding: 24px 32px;" dir="rtl">
              <p style="margin: 0 0 16px; font-size: 16px; color: #334155; line-height: 1.5;">
                שלום <strong>${name}</strong>,
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; color: #334155; line-height: 1.5;">
                קיבלנו בקשה לאיפוס הסיסמה שלך עבור <strong>${organizationName}</strong>.
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; color: #334155; line-height: 1.5;">
                השתמש בקוד הבא כדי לאפס את הסיסמה שלך:
              </p>
            </td>
          </tr>

          <!-- Verification Code Box -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 24px; background-color: #f1f5f9; border-radius: 8px; border: 2px dashed #cbd5e1;">
                    <div style="font-size: 48px; font-weight: 700; letter-spacing: 8px; color: #1e293b; font-family: 'Courier New', monospace;">
                      ${verificationCode}
                    </div>
                    <p style="margin: 12px 0 0; font-size: 14px; color: #64748b;">
                      קוד בן 6 ספרות / 6-digit code
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hebrew Warning -->
          <tr>
            <td style="padding: 0 32px 24px;" dir="rtl">
              <div style="padding: 16px; background-color: #fef3c7; border-right: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
                  ⏱️ <strong>חשוב:</strong> קוד זה תקף ל-15 דקות בלבד
                </p>
              </div>
            </td>
          </tr>

          <!-- Separator -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background-color: #e5e7eb;"></div>
            </td>
          </tr>

          <!-- English Content (LTR) -->
          <tr>
            <td style="padding: 24px 32px;" dir="ltr">
              <p style="margin: 0 0 16px; font-size: 16px; color: #334155; line-height: 1.5;">
                Hello <strong>${name}</strong>,
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; color: #334155; line-height: 1.5;">
                We received a password reset request for your account at <strong>${organizationName}</strong>.
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; color: #334155; line-height: 1.5;">
                Use the code above to reset your password. This code will expire in <strong>15 minutes</strong>.
              </p>
            </td>
          </tr>

          <!-- English Warning -->
          <tr>
            <td style="padding: 0 32px 24px;" dir="ltr">
              <div style="padding: 16px; background-color: #fee2e2; border-left: 4px solid #dc2626; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #7f1d1d; line-height: 1.5;">
                  🚨 <strong>Security Notice:</strong> If you didn't request this code, please ignore this email. Your password will remain unchanged.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                AI Governance Platform | מערכת ניהול בינה מלאכותית
                <br>
                This is an automated message, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
