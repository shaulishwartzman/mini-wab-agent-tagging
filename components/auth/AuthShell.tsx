/**
 * Shared visual shell for public auth pages (login, register-org, change-password).
 *
 * PURPOSE: Consistent centered card layout with brand title and optional footer links.
 * Does not handle auth logic — only presentation.
 *
 * @see app/login/page.tsx
 * @see app/register-org/page.tsx
 * @see app/change-password/page.tsx
 */

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type AuthShellProps = {
  /** Page heading shown above the card content. */
  title: string;
  /** Short supporting sentence under the title. */
  subtitle?: string;
  /** Main form / content. */
  children: ReactNode;
  /** Optional links below the card (e.g. back to home). */
  footer?: ReactNode;
};

/**
 * Centered auth page layout with brand header.
 *
 * @param props - Title, optional subtitle, children, optional footer
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        background:
          "linear-gradient(160deg, #f0f4f8 0%, #e2e8f0 45%, #f8fafc 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "#0f172a",
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "-0.02em",
            }}
          >
            AI Governance Platform
          </Link>
        </div>

        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            padding: "32px 28px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 24px rgba(15, 23, 42, 0.06)",
          }}
        >
          <h1
            style={{
              margin: "0 0 8px 0",
              fontSize: 22,
              fontWeight: 650,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              textAlign: "center",
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: 14,
                color: "#64748b",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>
          ) : (
            <div style={{ height: 16 }} />
          )}
          {children}
        </section>

        {footer ? (
          <div
            style={{
              marginTop: 20,
              textAlign: "center",
              fontSize: 14,
              color: "#64748b",
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </main>
  );
}

/** Shared input styles for auth forms. */
export const authInputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: 14,
  color: "#0f172a",
  backgroundColor: "#fff",
  outline: "none",
};

/** Shared primary button styles for auth forms. */
export const authPrimaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 8,
  border: "none",
  backgroundColor: "#1e40af",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

/** Shared label styles for auth forms. */
export const authLabelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#334155",
  marginBottom: 6,
};

/**
 * Inline error banner for auth forms.
 *
 * @param message - Hebrew (or English) error text to display
 */
export function AuthErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        marginBottom: 16,
        padding: "10px 12px",
        borderRadius: 8,
        backgroundColor: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#991b1b",
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      {message}
    </div>
  );
}

/**
 * Inline success banner for auth forms.
 *
 * @param message - Success text to display
 */
export function AuthSuccessBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      role="status"
      style={{
        marginBottom: 16,
        padding: "10px 12px",
        borderRadius: 8,
        backgroundColor: "#f0fdf4",
        border: "1px solid #bbf7d0",
        color: "#166534",
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      {message}
    </div>
  );
}
