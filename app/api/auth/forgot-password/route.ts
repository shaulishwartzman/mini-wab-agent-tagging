/**
 * POST /api/auth/forgot-password
 *
 * Generates a 6-digit verification code and sends it via email.
 * User must use this code within 15 minutes to reset their password.
 *
 * Request body: { email: string, organizationName?: string }
 * 
 * Security features:
 * - Rate limiting (1 request per minute per user)
 * - 6-digit numeric code
 * - Code expires in 15 minutes
 * - Code is hashed before storage
 * - Always returns success (timing-safe, doesn't reveal if email exists)
 *
 * @see app/api/auth/reset-password/route.ts - Verify code & set new password
 * @see lib/email/send.ts - sendVerificationCodeEmail function
 * @see lib/errors/auth.ts - ForgotPasswordErrors messages
 */

import { connectDB } from "@/lib/db/mongodb";
import { jsonError, jsonOk } from "@/lib/api/jsonResponse";
import { ForgotPasswordErrors } from "@/lib/errors/auth";
import { slugify } from "@/lib/utils/slugify";
import { sendVerificationCodeEmail } from "@/lib/email/send";
import User from "@/models/User";
import Organization from "@/models/Organization";
import crypto from "crypto";

/**
 * Generate 6-digit verification code.
 */
function generateVerificationCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * Hash code for storage.
 */
function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Check if user requested a code too recently (1 minute cooldown).
 */
function isRateLimited(lastRequest: Date | null | undefined): boolean {
  if (!lastRequest) {
    return false;
  }

  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  return lastRequest > oneMinuteAgo;
}

/**
 * Send verification code for password reset.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      organizationName?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const organizationName = body.organizationName?.trim();

    // Validate required fields
    if (!email) {
      return jsonError(ForgotPasswordErrors.missingFields, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return jsonError(ForgotPasswordErrors.invalidEmail, 400);
    }

    await connectDB();

    // Find user by email and organization
    let user;
    let orgName = organizationName || "System";
    
    if (organizationName) {
      const orgSlug = slugify(organizationName);
      const org = await Organization.findOne({ slug: orgSlug });
      
      if (!org) {
        console.log(`Password reset requested for non-existent org: ${organizationName}`);
        // Return success anyway (security - don't reveal org doesn't exist)
        return jsonOk({
          success: true,
          message: ForgotPasswordErrors.requestSent,
        });
      }
      
      user = await User.findByEmailAndOrg(email, org._id);
      orgName = org.name;
    } else {
      // No org = try to find SYSTEM_ADMIN
      user = await User.findSystemAdmin(email);
    }

    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      // Return success anyway (security - don't reveal email doesn't exist)
      return jsonOk({
        success: true,
        message: ForgotPasswordErrors.requestSent,
      });
    }

    // Check rate limiting
    if (isRateLimited(user.lastPasswordResetRequest)) {
      console.log(`Rate limit exceeded for password reset: ${user.email}`);
      return jsonError(ForgotPasswordErrors.rateLimitExceeded, 429);
    }

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    const hashedCode = hashCode(verificationCode);
    
    // Store hashed code with 15-minute expiration
    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    user.lastPasswordResetRequest = new Date();
    await user.save();

    console.log(`Verification code generated for user: ${user.email}`);

    // Send email with verification code
    await sendVerificationCodeEmail({
      to: email,
      name: user.name,
      organizationName: orgName,
      verificationCode,
    });

    console.log(`Verification code email sent to: ${user.email}`);

    return jsonOk({
      success: true,
      message: ForgotPasswordErrors.requestSent,
    });
  } catch (error) {
    console.error("forgot-password error:", error);
    return jsonError(ForgotPasswordErrors.serverError, 500);
  }
}
