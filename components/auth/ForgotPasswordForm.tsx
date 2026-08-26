"use client";

/**
 * Forgot password form with verification code flow.
 * 
 * Step 1: Enter email → Send 6-digit code
 * Step 2: Enter code + new password → Reset password
 *
 * @see app/api/auth/forgot-password/route.ts - Generates verification code
 * @see app/api/auth/reset-password/route.ts - Verifies code & sets new password
 */

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ForgotPasswordErrors } from "@/lib/errors/auth";
import {
  AuthErrorBanner,
  AuthSuccessBanner,
  authInputStyle,
  authLabelStyle,
  authPrimaryButtonStyle,
} from "@/components/auth/AuthShell";
import Link from "next/link";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "verify">("email");
  
  // Step 1: Email
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  
  // Step 2: Verification
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Step 1: Send verification code to email
   */
  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const trimmedEmail = email.trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError(ForgotPasswordErrors.invalidEmail);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          organizationName: organizationName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || ForgotPasswordErrors.serverError);
        setLoading(false);
        return;
      }

      // Move to verification step
      setStep("verify");
      setLoading(false);
    } catch (err) {
      console.error("Send code error:", err);
      setError(ForgotPasswordErrors.serverError);
      setLoading(false);
    }
  }

  /**
   * Step 2: Verify code and reset password
   */
  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const trimmedCode = verificationCode.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    // Validation
    if (!trimmedCode || !trimmedNewPassword || !trimmedConfirmPassword) {
      setError("נא למלא את כל השדות / Please fill all fields");
      setLoading(false);
      return;
    }

    if (trimmedCode.length !== 6) {
      setError("קוד האימות חייב להיות 6 ספרות / Verification code must be 6 digits");
      setLoading(false);
      return;
    }

    if (trimmedNewPassword.length < 8) {
      setError("הסיסמה חייבת להיות לפחות 8 תווים / Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setError("הסיסמאות אינן זהות / Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          organizationName: organizationName.trim(),
          verificationCode: trimmedCode,
          newPassword: trimmedNewPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "שגיאת שרת / Server error");
        setLoading(false);
        return;
      }

      // Success - redirect to login
      router.push("/login?passwordReset=1");
    } catch (err) {
      console.error("Reset password error:", err);
      setError("שגיאת שרת / Server error");
      setLoading(false);
    }
  }

  // STEP 1: Enter email to receive verification code
  if (step === "email") {
    return (
      <div dir="rtl">
        <div style={{ marginBottom: 16, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
            הזינו את כתובת המייל שלכם לקבלת קוד אימות
            <br />
            Enter your email to receive a verification code
          </p>
        </div>

        <form onSubmit={handleSendCode} style={{ display: "grid", gap: 14 }}>
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
              השאירו ריק עבור מנהל מערכת (SYSTEM_ADMIN)
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
              autoFocus
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
            {loading ? "שולח קוד…" : "שליחת קוד אימות"}
          </button>

          <div style={{ textAlign: "center", marginTop: 8 }}>
            <Link
              href="/login"
              style={{
                color: "#3b82f6",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              ← חזרה להתחברות / Back to login
            </Link>
          </div>
        </form>
      </div>
    );
  }

  // STEP 2: Enter verification code and new password
  return (
    <div dir="rtl">
      <div style={{ marginBottom: 16, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
          קוד אימות נשלח ל-{email}
          <br />
          Verification code sent to {email}
        </p>
      </div>

      <form onSubmit={handleResetPassword} style={{ display: "grid", gap: 14 }}>
        <AuthSuccessBanner message="✓ קוד נשלח למייל / Code sent to email" />
        <AuthErrorBanner message={error} />

        <div>
          <label htmlFor="verificationCode" style={authLabelStyle}>
            קוד אימות (6 ספרות)
          </label>
          <input
            id="verificationCode"
            name="verificationCode"
            type="text"
            required
            autoComplete="off"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Only digits
              setVerificationCode(value);
            }}
            style={{
              ...authInputStyle,
              fontSize: 24,
              letterSpacing: 8,
              textAlign: "center",
              fontFamily: "monospace",
            }}
            placeholder="000000"
            dir="ltr"
            autoFocus
          />
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>
            בדקו את תיבת המייל שלכם (כולל ספאם) / Check your email inbox (including spam)
          </p>
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
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onBlur={(e) => setNewPassword(e.target.value.trim())}
            style={authInputStyle}
            placeholder="Min 8 characters"
            dir="ltr"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" style={authLabelStyle}>
            אימות סיסמה
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={(e) => setConfirmPassword(e.target.value.trim())}
            style={authInputStyle}
            placeholder="Re-enter new password"
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
          {loading ? "מאפס סיסמה…" : "אימות ואיפוס סיסמה"}
        </button>

        <div style={{ textAlign: "center", marginTop: 8, fontSize: 14 }}>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError("");
              setVerificationCode("");
              setNewPassword("");
              setConfirmPassword("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#3b82f6",
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
            }}
          >
            לא קיבלתי קוד? שלחו שוב / Didn't receive code? Resend
          </button>
        </div>
      </form>
    </div>
  );
}
