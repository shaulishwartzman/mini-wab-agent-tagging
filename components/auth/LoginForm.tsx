"use client";

/**
 * Login form for organization users and SYSTEM_ADMIN.
 *
 * Fields:
 * - Organization name (optional for SYSTEM_ADMIN — leave empty)
 * - Email
 * - Password
 *
 * On success: redirects to `callbackUrl` or `/dashboard`.
 * If session has mustChangePassword, proxy forces `/change-password`.
 *
 * @see lib/auth/auth-options.ts - Credentials authorize logic
 * @see lib/utils/slugify.ts - Org name → slug
 * @see lib/errors/auth.ts - Hebrew login error messages
 */

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { slugify } from "@/lib/utils/slugify";
import { LoginErrors } from "@/lib/errors/auth";
import {
  AuthErrorBanner,
  AuthSuccessBanner,
  authInputStyle,
  authLabelStyle,
  authPrimaryButtonStyle,
} from "@/components/auth/AuthShell";

/**
 * Credentials login form with Hebrew user-facing messages.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const registered = searchParams.get("registered") === "1";
  const passwordChanged = searchParams.get("passwordChanged") === "1";
  const passwordReset = searchParams.get("passwordReset") === "1";

  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Submit credentials via NextAuth `signIn`.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const orgSlug = organizationName.trim()
      ? slugify(organizationName)
      : "";

    if (organizationName.trim() && !orgSlug) {
      setError(LoginErrors.invalidOrganizationName);
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        redirect: false,
        organizationSlug: orgSlug,
        email: email.trim(),
        password,
      });

      if (!result || result.error) {
        setError(LoginErrors.credentialsFailed);
        setLoading(false);
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError(LoginErrors.unexpected);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }} dir="rtl">
      {registered ? (
        <AuthSuccessBanner message="הארגון נרשם בהצלחה. התחברו עם פרטי ה-CISO (סיסמה זמנית נשלחה למייל)." />
      ) : null}
      {passwordChanged ? (
        <AuthSuccessBanner message="הסיסמה עודכנה בהצלחה. התחברו עם הסיסמה החדשה." />
      ) : null}
      {passwordReset ? (
        <AuthSuccessBanner message="הסיסמה אופסה בהצלחה. התחברו עם הסיסמה החדשה. / Password reset successful. Login with your new password." />
      ) : null}
      <AuthErrorBanner message={error} />

      <div>
        <label htmlFor="organizationName" style={authLabelStyle}>
          שם הארגון
        </label>
        <input
          id="organizationName"
          name="organizationName"
          type="text"
          autoComplete="organization"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          onBlur={(e) => setOrganizationName(e.target.value.trim())}
          style={authInputStyle}
          placeholder="your organization's name"
        />
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>
          השאירו ריק להתחברות כמנהל מערכת (SYSTEM_ADMIN)
        </p>
      </div>

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
          onBlur={(e) => setEmail(e.target.value.trim())}
          style={authInputStyle}
          placeholder="you@example.com"
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
        <div style={{ marginTop: 8, textAlign: "left" }}>
          <Link
            href="/forgot-password"
            style={{
              fontSize: 14,
              color: "#3b82f6",
              textDecoration: "none",
            }}
          >
            שכחתי סיסמה / Forgot password?
          </Link>
        </div>
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
        {loading ? "מתחבר…" : "התחברות"}
      </button>
    </form>
  );
}
