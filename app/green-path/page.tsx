/**
 * CISO-only Green Path settings page.
 *
 * Route: /green-path
 * Non-CISO roles see an unauthorized message.
 *
 * @see components/GreenPathSettingsForm.tsx
 */

"use client";

import Link from "next/link";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { GreenPathSettingsForm } from "@/components/GreenPathSettingsForm";
import { useRole } from "@/contexts/RoleContext";
import { UserRole } from "@/lib/types";

export default function GreenPathSettingsPage() {
  const { currentUser } = useRole();
  const isCiso = currentUser.role === UserRole.CISO;

  return (
    <>
      <RoleSwitcher />
      <main
        style={{
          padding: "48px 32px",
          backgroundColor: "#f8f9fa",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
        dir="rtl"
      >
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: 16,
            padding: 32,
            border: "1px solid #eaecf0",
            boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <Link
              href="/dashboard"
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: 8,
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              ← חזרה ללוח הבקרה
            </Link>
          </div>

          <h1
            style={{
              margin: "0 0 8px 0",
              fontSize: 24,
              fontWeight: 700,
              color: "#101828",
            }}
          >
            הגדרות נתיב ירוק
          </h1>
          <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: 14 }}>
            Green Path Settings — קביעת תנאי האישור האוטומטי
          </p>

          {isCiso ? (
            <GreenPathSettingsForm />
          ) : (
            <div
              style={{
                padding: 24,
                borderRadius: 8,
                backgroundColor: "#fef2f2",
                border: "1px solid #fca5a5",
                color: "#991b1b",
                fontSize: 15,
              }}
            >
              אין לך הרשאה לערוך את הנתיב הירוק. רק משתמש בתפקיד CISO יכול לגשת
              לעמוד זה.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
