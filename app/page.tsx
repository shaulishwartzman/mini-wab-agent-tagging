/**
 * Public home / landing page.
 *
 * - Guests see Sign in + Register organization CTAs
 * - Authenticated users are redirected to `/dashboard`
 *   (or `/change-password` when `mustChangePassword` is true)
 *
 * @see app/dashboard/page.tsx - Main app dashboard
 * @see app/login/page.tsx
 * @see app/register-org/page.tsx
 * @see lib/auth/session.ts - Server session helper
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";

/**
 * Landing page (server component) with auth-aware redirect.
 */
export default async function HomePage() {
  const session = await getAuthSession();

  if (session?.user) {
    if (session.user.mustChangePassword) {
      redirect("/change-password");
    }
    redirect("/dashboard");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(160deg, #0f172a 0%, #1e3a5f 42%, #0f172a 100%)",
        color: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 20px",
          textAlign: "center",
          gap: 20,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#38bdf8",
          }}
        >
          LEEH
        </p>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            maxWidth: 640,
            lineHeight: 1.15,
          }}
        >
          AI Governance Platform
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 16,
            lineHeight: 1.6,
            color: "#94a3b8",
            maxWidth: 480,
          }}
          dir="rtl"
        >
          פורטל לניהול בקשות סוכני AI, אישורים ובקרת סיכונים בארגון.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
            marginTop: 12,
          }}
        >
          <Link
            href="/login"
            style={{
              display: "inline-block",
              padding: "12px 22px",
              borderRadius: 10,
              backgroundColor: "#38bdf8",
              color: "#0f172a",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            התחברות
          </Link>
          <Link
            href="/register-org"
            style={{
              display: "inline-block",
              padding: "12px 22px",
              borderRadius: 10,
              backgroundColor: "transparent",
              color: "#e2e8f0",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              border: "1px solid #475569",
            }}
          >
            רישום ארגון חדש
          </Link>
        </div>

        <div
          style={{
            marginTop: 28,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            <Link href="/dashboard" style={{ color: "#94a3b8" }}>
              כניסה זמנית ללוח הבקרה (MVP RoleSwitcher)
            </Link>
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            <Link
              href="/admin/login"
              style={{ color: "#a78bfa", fontWeight: 500 }}
            >
              כניסת מנהל מערכת
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
