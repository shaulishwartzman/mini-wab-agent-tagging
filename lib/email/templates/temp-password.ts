/**
 * HTML email template for temporary password delivery.
 * 
 * Features:
 * - Bilingual (Hebrew RTL + English LTR)
 * - Responsive design
 * - Security notice
 * - Login link
 * - Professional styling
 * 
 * @see lib/email/send.ts - Uses this template
 */

export interface TempPasswordEmailParams {
  /** Recipient name */
  name: string;
  /** Organization name */
  organizationName: string;
  /** Temporary password (plain text) */
  tempPassword: string;
  /** User role */
  role: string;
}

/**
 * Get role label in Hebrew.
 */
function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    EMPLOYEE: 'עובד',
    MANAGER: 'מנהל',
    CISO: 'CISO',
    SYSTEM_ADMIN: 'מנהל מערכת',
  };
  return labels[role] || role;
}

/**
 * Generate HTML email template for temporary password.
 * 
 * @param params - Template parameters
 * @returns HTML string for email body
 */
export function tempPasswordEmailTemplate(
  params: TempPasswordEmailParams
): string {
  const { name, organizationName, tempPassword, role } = params;
  const roleLabel = getRoleLabel(role);
  const loginUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>סיסמה זמנית - Temporary Password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f8fafc;
      direction: rtl;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 16px 0;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .password-box {
      background: #f1f5f9;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      text-align: center;
    }
    .password-label {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 8px 0;
    }
    .password {
      font-family: 'Courier New', monospace;
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: 2px;
      margin: 0;
      word-break: break-all;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      margin: 8px 0;
      text-align: center;
    }
    .button:hover {
      background: #2563eb;
    }
    .warning {
      background: #fef3c7;
      border-right: 4px solid #f59e0b;
      padding: 16px;
      border-radius: 6px;
      margin: 24px 0;
    }
    .warning-title {
      font-size: 14px;
      font-weight: 600;
      color: #92400e;
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .warning-text {
      font-size: 13px;
      color: #92400e;
      margin: 0;
      line-height: 1.5;
    }
    .divider {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 32px 0;
    }
    .english {
      direction: ltr;
      text-align: left;
    }
    .footer {
      padding: 24px;
      text-align: center;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
    }
    .info-box {
      background: #eff6ff;
      border-right: 3px solid #3b82f6;
      padding: 12px 16px;
      border-radius: 6px;
      margin: 16px 0;
    }
    .info-text {
      font-size: 13px;
      color: #1e40af;
      margin: 0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <!-- Header -->
      <div class="header">
        <h1>🔐 סיסמה זמנית</h1>
        <p>Temporary Password</p>
      </div>

      <!-- Content - Hebrew -->
      <div class="content">
        <p class="greeting">שלום ${name},</p>
        
        <p class="text">
          ברוך הבא ל<strong>${organizationName}</strong>!
        </p>
        
        <p class="text">
          נוצר עבורך חשבון חדש במערכת AI Governance Platform בתפקיד <strong>${roleLabel}</strong>.
        </p>

        <div class="info-box">
          <p class="info-text">
            <strong>🔑 הסיסמה הזמנית שלך:</strong>
          </p>
        </div>

        <div class="password-box">
          <p class="password-label">Temporary Password</p>
          <p class="password">${tempPassword}</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${loginUrl}/login" class="button">
            כניסה למערכת / Login
          </a>
        </div>

        <div class="warning">
          <p class="warning-title">
            ⚠️ חשוב לדעת
          </p>
          <p class="warning-text">
            • בכניסה הראשונה תתבקש לשנות את הסיסמה<br>
            • אל תשתף את הסיסמה הזמנית עם אחרים<br>
            • הסיסמה החדשה חייבת להכיל לפחות 8 תווים
          </p>
        </div>

        <hr class="divider">

        <!-- Content - English -->
        <div class="english">
          <p class="greeting">Hello ${name},</p>
          
          <p class="text">
            Welcome to <strong>${organizationName}</strong>!
          </p>
          
          <p class="text">
            A new account has been created for you in the AI Governance Platform as <strong>${role}</strong>.
          </p>

          <div class="password-box">
            <p class="password-label">Your Temporary Password</p>
            <p class="password">${tempPassword}</p>
          </div>

          <div class="warning">
            <p class="warning-title">
              ⚠️ Important Information
            </p>
            <p class="warning-text">
              • You will be required to change your password on first login<br>
              • Do not share this temporary password with others<br>
              • Your new password must be at least 8 characters long
            </p>
          </div>

          <p class="text">
            <strong>Login URL:</strong><br>
            <a href="${loginUrl}/login" style="color: #3b82f6; text-decoration: none;">
              ${loginUrl}/login
            </a>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="footer-text">
          AI Governance & Agent Risk Assessment Platform<br>
          ${organizationName}
        </p>
        <p class="footer-text" style="margin-top: 8px;">
          This is an automated email. Please do not reply.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
