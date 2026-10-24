"use client";

/**
 * Organization registration form — creates an org + first CISO user.
 *
 * Posts to `POST /api/organizations`.
 * On success, redirects to `/login?registered=1`.
 *
 * Required fields: organization name, CISO name, CISO email.
 * At least one CISO is required at registration time.
 *
 * @see app/api/organizations/route.ts - API endpoint
 * @see lib/api/organizations.ts - Client helper
 * @see lib/utils/slugify.ts - Live slug preview
 */

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils/slugify";
import { registerOrganization } from "@/lib/api/organizations";
import {
  RegisterOrgErrors,
  resolveAuthError,
} from "@/lib/errors/auth";
import {
  AuthErrorBanner,
  authInputStyle,
  authLabelStyle,
  authPrimaryButtonStyle,
} from "@/components/auth/AuthShell";

/**
 * Form to register a new organization with its first CISO.
 */
export function RegisterOrgForm() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [cisoName, setCisoName] = useState("");
  const [cisoEmail, setCisoEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const slugPreview = useMemo(
    () => (organizationName.trim() ? slugify(organizationName) : ""),
    [organizationName],
  );

  /**
   * Validate and submit organization registration.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!slugPreview) {
      setError(RegisterOrgErrors.invalidOrganizationName);
      return;
    }

    setLoading(true);
    try {
      const result = await registerOrganization({
        name: organizationName.trim(),
        cisoName: cisoName.trim(),
        cisoEmail: cisoEmail.trim().toLowerCase(),
      });

      if (!result.success) {
        setError(
          resolveAuthError(result.error, RegisterOrgErrors.failedRetry),
        );
        setLoading(false);
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError(RegisterOrgErrors.unexpected);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }} dir="rtl">
      <AuthErrorBanner message={error} />

      <div>
        <label htmlFor="orgName" style={authLabelStyle}>
          שם הארגון
        </label>
        <input
          id="orgName"
          name="orgName"
          type="text"
          required
          minLength={2}
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          onBlur={(e) => setOrganizationName(e.target.value.trim())}
          style={authInputStyle}
          placeholder="your organization's name"
        />
        {slugPreview ? (
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b" }} dir="ltr">
            מזהה להתחברות (slug): <strong>{slugPreview}</strong>
          </p>
        ) : null}
      </div>

      <fieldset
        style={{
          margin: 0,
          padding: "14px 12px",
          borderRadius: 10,
          border: "1px solid #e2e8f0",
          display: "grid",
          gap: 12,
        }}
      >
        <legend
          style={{
            padding: "0 6px",
            fontSize: 13,
            fontWeight: 650,
            color: "#1e40af",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          משתמש CISO ראשון (חובה)
          <span
            title="CISO (Chief Information Security Officer) הוא מנהל אבטחת המידע הראשי. הוא אחראי על אישור סוכני AI וניהול סיכוני אבטחה בארגון. נדרש לפחות משתמש CISO אחד לפתיחת ארגון חדש."
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: "#dbeafe",
              color: "#1e40af",
              fontSize: 11,
              fontWeight: 700,
              cursor: "help",
              border: "1px solid #93c5fd",
            }}
          >
            ?
          </span>
        </legend>

        <div>
          <label htmlFor="cisoName" style={authLabelStyle}>
            שם מלא
          </label>
          <input
            id="cisoName"
            name="cisoName"
            type="text"
            required
            minLength={2}
            value={cisoName}
            onChange={(e) => setCisoName(e.target.value)}
            onBlur={(e) => setCisoName(e.target.value.trim())}
            style={authInputStyle}
            placeholder="שם ה-CISO"
          />
        </div>

        <div>
          <label htmlFor="cisoEmail" style={authLabelStyle}>
            אימייל
          </label>
          <input
            id="cisoEmail"
            name="cisoEmail"
            type="email"
            required
            value={cisoEmail}
            onChange={(e) => setCisoEmail(e.target.value)}
            onBlur={(e) => setCisoEmail(e.target.value.trim())}
            style={authInputStyle}
            placeholder="ciso@company.com"
            dir="ltr"
          />
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>
            סיסמה זמנית תישלח לכתובת זו
          </p>
        </div>
      </fieldset>

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
        {loading ? "רושם ארגון…" : "רישום ארגון"}
      </button>
    </form>
  );
}
