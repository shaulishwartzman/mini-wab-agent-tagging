"use client";

/**
 * Login form for SYSTEM_ADMIN users.
 *
 * Simplified login with only email + password (no organization field).
 * Automatically passes empty organizationSlug to trigger admin auth path.
 *
 * @see lib/auth/auth-options.ts - SYSTEM_ADMIN authorize logic
 * @see lib/errors/admin.ts - Hebrew admin login messages
 * @see app/admin/login/page.tsx - Admin login page
 */

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AdminLoginErrors } from "@/lib/errors/admin";
import {
  AuthErrorBanner,
  authInputStyle,
  authLabelStyle,
  authPrimaryButtonStyle,
} from "@/components/auth/AuthShell";

/**
 * SYSTEM_ADMIN login form with Hebrew user-facing messages.
 */
export function AdminLoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Submit admin credentials via NextAuth `signIn`.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        organizationSlug: "", // Empty triggers SYSTEM_ADMIN auth path
        email: email.trim(),
        password,
      });

      if (!result || result.error) {
        setError(AdminLoginErrors.credentialsFailed);
        setLoading(false);
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError(AdminLoginErrors.unexpected);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }} dir="rtl">
      <AuthErrorBanner message={error} />

      <div>
        <label htmlFor="email" style={authLabelStyle}>
          אימייל
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={authInputStyle}
          placeholder="admin@example.com"
          dir="ltr"
        />
      </div>

      <div>
        <label htmlFor="password" style={authLabelStyle}>
          סיסמה
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={authInputStyle}
          dir="ltr"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          ...authPrimaryButtonStyle,
          backgroundColor: "#7c3aed", // Purple for admin
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "wait" : "pointer",
          marginTop: 4,
        }}
      >
        {loading ? "מתחבר…" : "כניסה למערכת"}
      </button>
    </form>
  );
}
