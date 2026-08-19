/**
 * Email sending utilities using nodemailer.
 * 
 * Sends temporary password emails to new users and CISO accounts.
 * Uses SMTP configuration from environment variables.
 * 
 * @see app/api/users/route.ts - Calls sendTempPasswordEmail after user creation
 * @see app/api/organizations/route.ts - Calls sendTempPasswordEmail after CISO creation
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { tempPasswordEmailTemplate } from './templates/temp-password';

/**
 * SMTP transporter configured from environment variables.
 * 
 * Configuration:
 * - SMTP_HOST: SMTP server hostname (e.g., smtp.gmail.com)
 * - SMTP_PORT: SMTP server port (default: 587)
 * - SMTP_SECURE: Use TLS (true for port 465, false for others)
 * - SMTP_USER: SMTP authentication username
 * - SMTP_PASS: SMTP authentication password (use App Password for Gmail)
 * 
 * @example Gmail setup in .env.local:
 * ```
 * SMTP_HOST=smtp.gmail.com
 * SMTP_PORT=587
 * SMTP_SECURE=false
 * SMTP_USER=your-email@gmail.com
 * SMTP_PASS=your-16-char-app-password
 * ```
 */
let transporter: Transporter | null = null;

/**
 * Get or create nodemailer transporter.
 * Lazy initialization to avoid creating transporter if SMTP not configured.
 */
function getTransporter(): Transporter {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error(
        'SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local'
      );
    }

    transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user,
        pass,
      },
    });
  }

  return transporter;
}

/**
 * Parameters for sending temporary password email.
 */
export interface SendTempPasswordEmailParams {
  /** Recipient email address */
  to: string;
  /** Recipient name */
  name: string;
  /** Organization name */
  organizationName: string;
  /** Temporary password (plain text) */
  tempPassword: string;
  /** User role (EMPLOYEE, MANAGER, CISO) */
  role: string;
}

/**
 * Send temporary password email to a newly created user.
 * 
 * Email includes:
 * - Welcome message in Hebrew and English
 * - Temporary password
 * - Login link
 * - Security notice (must change password on first login)
 * 
 * Error handling:
 * - If SMTP not configured: Logs warning, doesn't throw
 * - If email fails: Logs error, doesn't throw
 * - Reason: User creation should succeed even if email fails
 * - Fallback: Password is always logged to terminal
 * 
 * @param params - Email parameters
 * @returns Promise<void> - Resolves when email sent or error logged
 * 
 * @example
 * ```typescript
 * await sendTempPasswordEmail({
 *   to: 'user@example.com',
 *   name: 'John Doe',
 *   organizationName: 'Acme Corp',
 *   tempPassword: 'Temp@Pass123',
 *   role: 'EMPLOYEE',
 * });
 * ```
 */
export async function sendTempPasswordEmail(
  params: SendTempPasswordEmailParams
): Promise<void> {
  const { to, name, organizationName, tempPassword, role } = params;

  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.warn(
        `⚠️  SMTP not configured - email not sent to ${to}`
      );
      console.warn(
        '   Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env.local to enable emails'
      );
      return;
    }

    // Get transporter
    const mailer = getTransporter();

    // Render email template
    const html = tempPasswordEmailTemplate({
      name,
      organizationName,
      tempPassword,
      role,
    });

    // Email sender configuration
    const fromAddress =
      process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER;
    const fromName = process.env.EMAIL_FROM_NAME || 'AI Governance Platform';

    // Send email
    await mailer.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject: `ברוך הבא ל-${organizationName} - סיסמה זמנית / Welcome - Temporary Password`,
      html,
      text: `
שלום ${name},

ברוך הבא ל-${organizationName}!

נוצר עבורך חשבון חדש במערכת AI Governance Platform.

הסיסמה הזמנית שלך היא: ${tempPassword}

בכניסה הראשונה תתבקש לשנות את הסיסמה.

לכניסה למערכת: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login

---

Hello ${name},

Welcome to ${organizationName}!

A new account has been created for you in the AI Governance Platform.

Your temporary password is: ${tempPassword}

You will be required to change your password on first login.

Login at: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login
      `.trim(),
    });

    console.log(`✅ Email sent successfully to ${to}`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err);
    // Don't throw - user creation should succeed even if email fails
  }
}
