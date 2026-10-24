"use client";

/**
 * Force / voluntary password change form.
 *
 * Used on first login when `mustChangePassword` is true (temp password).
 * Calls `POST /api/auth/change-password`, then refreshes the JWT session
 * so the proxy stops redirecting to this page.
 *
 * @see app/api/auth/change-password/route.ts
 * @see lib/auth/auth-options.ts - jwt update trigger
 */

import { FormEvent, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/lib/api/auth";
import {
  ChangePasswordErrors,
  resolveAuthError,
} from "@/lib/errors/auth";
import {
  AuthErrorBanner,
  AuthSuccessBanner,
  authInputStyle,
  authLabelStyle,
  authPrimaryButtonStyle,
} from "@/components/auth/AuthShell";

/**
 * Form to replace a temporary (or current) password with a new one.
 */
export function ChangePasswordForm() {
  const router = useRouter();
  const { update } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Validate passwords and submit change request.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError(ChangePasswordErrors.tooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(ChangePasswordErrors.mismatch);
      return;
    }
    if (newPassword === currentPassword) {
      setError(ChangePasswordErrors.sameAsCurrent);
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
      });

      if (!result.success) {
        setError(
          resolveAuthError(result.error, ChangePasswordErrors.failed),
        );
        setLoading(false);
        return;
      }

      // Clear mustChangePassword in the JWT so proxy allows navigation
      await update({ mustChangePassword: false });
      setSuccess("הסיסמה עודכנה בהצלחה. מעבירים ללוח הבקרה…");
      
      // Small delay to let the session cookie propagate, then full reload
      // to ensure proxy sees the updated JWT
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch {
      setError(ChangePasswordErrors.unexpected);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }} dir="rtl">
      <AuthErrorBanner message={error} />
      <AuthSuccessBanner message={success} />

      <div>
        <label htmlFor="currentPassword" style={authLabelStyle}>
          סיסמה נוכחית (זמנית)
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          style={authInputStyle}
          dir="ltr"
        />
      </div>

      <div>
        <label htmlFor="newPassword" style={authLabelStyle}>
          סיסמה חדשה
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={authInputStyle}
          dir="ltr"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" style={authLabelStyle}>
          אימות סיסמה חדשה
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={authInputStyle}
          dir="ltr"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          ...authPrimaryButtonStyle,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "wait" : "pointer",
          marginTop: 4,
        }}
      >
        {loading ? "מעדכן…" : "עדכון סיסמה"}
      </button>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        style={{
          ...authPrimaryButtonStyle,
          backgroundColor: "transparent",
          color: "#64748b",
          border: "1px solid #cbd5e1",
          fontWeight: 500,
        }}
      >
        התנתקות
      </button>
    </form>
  );
}
