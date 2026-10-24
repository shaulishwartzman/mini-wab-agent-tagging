/**
 * POST /api/auth/change-password
 *
 * Allows an authenticated user to replace their password (required on first
 * login when `mustChangePassword` is true). Verifies the current password,
 * hashes the new one via the User model pre-save hook, and clears
 * `mustChangePassword`.
 *
 * Auth: NextAuth session required (401 if missing).
 *
 * Body: { currentPassword: string, newPassword: string }
 *
 * @see components/auth/ChangePasswordForm.tsx
 * @see lib/errors/auth.ts - Hebrew change-password messages
 * @see lib/api/jsonResponse.ts - jsonError helper
 */

import { connectDB } from "@/lib/db/mongodb";
import { getAuthUser } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/jsonResponse";
import { ChangePasswordErrors } from "@/lib/errors/auth";
import User from "@/models/User";

/**
 * Change password for the currently signed-in user.
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user?.id) {
      return jsonError(ChangePasswordErrors.unauthorized, 401);
    }

    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";

    if (!currentPassword || !newPassword) {
      return jsonError(ChangePasswordErrors.missingFields, 400);
    }

    if (newPassword.length < 8) {
      return jsonError(ChangePasswordErrors.tooShort, 400);
    }

    if (newPassword === currentPassword) {
      return jsonError(ChangePasswordErrors.sameAsCurrent, 400);
    }

    await connectDB();

    const dbUser = await User.findById(user.id).select("+password");
    if (!dbUser) {
      return jsonError(ChangePasswordErrors.userNotFound, 404);
    }

    const matches = await dbUser.comparePassword(currentPassword);
    if (!matches) {
      return jsonError(ChangePasswordErrors.wrongCurrent, 400);
    }

    dbUser.password = newPassword;
    dbUser.mustChangePassword = false;
    await dbUser.save();

    return jsonOk({
      success: true,
      message: ChangePasswordErrors.success,
    });
  } catch (error) {
    console.error("change-password error:", error);
    return jsonError(ChangePasswordErrors.serverError, 500);
  }
}
