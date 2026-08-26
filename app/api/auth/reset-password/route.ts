/**
 * POST /api/auth/reset-password
 *
 * Verifies 6-digit verification code and updates password.
 * Code must match and not be expired (within 15 minutes).
 *
 * Request body: { email, organizationName?, verificationCode, newPassword }
 * 
 * Security features:
 * - Code verification with expiration check (15 minutes)
 * - Hashed code comparison
 * - Password validation (min 8 chars)
 * - Code cleared after successful use (one-time use)
 *
 * @see app/api/auth/forgot-password/route.ts - Code generation endpoint
 * @see models/User.ts - User schema
 * @see lib/errors/auth.ts - ResetPasswordErrors messages
 */

import { connectDB } from "@/lib/db/mongodb";
import { jsonError, jsonOk } from "@/lib/api/jsonResponse";
import { ResetPasswordErrors } from "@/lib/errors/auth";
import { slugify } from "@/lib/utils/slugify";
import User from "@/models/User";
import Organization from "@/models/Organization";
import crypto from "crypto";

/**
 * Hash code to match stored format.
 */
function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Reset password using verification code.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      organizationName?: string;
      verificationCode?: string;
      newPassword?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const organizationName = body.organizationName?.trim();
    const verificationCode = body.verificationCode?.trim();
    const newPassword = body.newPassword?.trim();

    // Validate required fields
    if (!email || !verificationCode || !newPassword) {
      return jsonError(ResetPasswordErrors.missingFields, 400);
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(verificationCode)) {
      return jsonError(
        "קוד האימות חייב להיות 6 ספרות / Verification code must be 6 digits",
        400
      );
    }

    // Validate password length
    if (newPassword.length < 8) {
      return jsonError(ResetPasswordErrors.passwordTooShort, 400);
    }

    await connectDB();

    // Find user by email and organization
    let user;
    
    if (organizationName) {
      const orgSlug = slugify(organizationName);
      const org = await Organization.findOne({ slug: orgSlug });
      
      if (!org) {
        return jsonError(ResetPasswordErrors.invalidToken, 400);
      }
      
      user = await User.findOne({
        email,
        organizationId: org._id,
      }).select("+resetPasswordToken +resetPasswordExpires");
    } else {
      // No org = try to find SYSTEM_ADMIN
      user = await User.findOne({
        email,
        organizationId: null,
        role: "SYSTEM_ADMIN",
      }).select("+resetPasswordToken +resetPasswordExpires");
    }

    if (!user) {
      console.log(`Password reset attempted for non-existent user: ${email}`);
      return jsonError(ResetPasswordErrors.invalidToken, 400);
    }

    // Check if code exists and hasn't expired
    if (!user.resetPasswordToken || !user.resetPasswordExpires) {
      console.log(`No verification code found for user: ${user.email}`);
      return jsonError(ResetPasswordErrors.invalidToken, 400);
    }

    if (user.resetPasswordExpires < new Date()) {
      console.log(`Expired verification code for user: ${user.email}`);
      return jsonError(
        "קוד האימות פג תוקף / Verification code expired",
        400
      );
    }

    // Verify code matches
    const hashedCode = hashCode(verificationCode);
    if (user.resetPasswordToken !== hashedCode) {
      console.log(`Invalid verification code for user: ${user.email}`);
      return jsonError(
        "קוד אימות שגוי / Invalid verification code",
        400
      );
    }

    // Update password (triggers pre-save hash)
    user.password = newPassword;
    user.mustChangePassword = false;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    await user.save();

    console.log(`Password reset successful for user: ${user.email}`);

    return jsonOk({
      success: true,
      message: ResetPasswordErrors.success,
    });
  } catch (error) {
    console.error("reset-password error:", error);
    return jsonError(ResetPasswordErrors.serverError, 500);
  }
}
