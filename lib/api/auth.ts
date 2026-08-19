/**
 * Client-side helpers for auth-related API calls (non-NextAuth endpoints).
 *
 * @see app/api/auth/change-password/route.ts
 * @see components/auth/ChangePasswordForm.tsx
 */

import {
  ChangePasswordErrors,
  resolveAuthError,
} from "@/lib/errors/auth";

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResult = {
  success: boolean;
  error?: string;
};

/**
 * Change the signed-in user's password.
 *
 * @param payload - Current and new password
 * @returns Result with success flag and optional Hebrew error
 */
export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<ChangePasswordResult> {
  const res = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    return {
      success: false,
      error: resolveAuthError(data.error, ChangePasswordErrors.failed),
    };
  }

  return { success: true };
}
