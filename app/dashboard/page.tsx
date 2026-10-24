/**
 * Authenticated dashboard for the AI Governance platform.
 *
 * Route: `/dashboard` (requires authentication via NextAuth session).
 *
 * Role-based content:
 * - EMPLOYEE: Form + My Requests
 * - MANAGER: Form + My Requests + Pending Recommendations
 * - CISO: Quick filter tabs —
 *   ממתין לטיפולי | בקשות פעילות | היסטוריית אישורים
 *
 * SYSTEM_ADMIN users see the RoleSwitcher banner to impersonate roles.
 * Regular users see their dashboard based on their session role.
 *
 * @see app/page.tsx - Public landing (login / register org)
 * @see components/RoleSwitcher.tsx - Admin role impersonation UI
 * @see components/DashboardTabs.tsx - Tab navigation
 * @see components/RequestQueue.tsx - Request lists with pagination
 * @see components/AgentForm.tsx - Questionnaire form
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AgentForm from "@/components/AgentForm";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { SessionNav } from "@/components/auth/SessionNav";
import { DashboardTabs, getDefaultTab } from "@/components/DashboardTabs";
import { HistoryStatusFilters } from "@/components/HistoryStatusFilters";
import { RequestQueue } from "@/components/RequestQueue";
import { useRole } from "@/contexts/RoleContext";
import { UserRole } from "@/lib/types";
import {
  HistoryFilterMode,
  getCisoQueueView,
  getHistoryFilterOptions,
  getHistoryTitle,
  type HistoryFilterMode as HistoryFilterModeType,
} from "@/lib/utils/dashboardFilters";

/**
 * Effective user for dashboard display.
 * - SYSTEM_ADMIN: Uses RoleContext (impersonation)
 * - Regular users: Uses session role/user
 */
type EffectiveUser = {
  id: string;
  role: (typeof UserRole)[keyof typeof UserRole];
  name: string;
};

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { currentUser: roleContextUser } = useRole();

  // Determine effective user: admin impersonates via RoleContext, others use session
  const effectiveUser: EffectiveUser = useMemo(() => {
    if (session?.user?.role === UserRole.SYSTEM_ADMIN) {
      // Admin is impersonating a role via RoleContext
      return {
        id: roleContextUser.id,
        role: roleContextUser.role as (typeof UserRole)[keyof typeof UserRole],
        name: roleContextUser.name,
      };
    }
    // Regular user: use their actual session (use _id, not email)
    const sessionRole = (session?.user?.role ?? UserRole.EMPLOYEE) as (typeof UserRole)[keyof typeof UserRole];
    return {
      id: session?.user?.id ?? "",
      role: sessionRole,
      name: session?.user?.name ?? "",
    };
  }, [session, roleContextUser]);

  const [activeTab, setActiveTab] = useState(() =>
    getDefaultTab(effectiveUser.role)
  );
  const [historyMode, setHistoryMode] = useState<HistoryFilterModeType>(
    HistoryFilterMode.ALL
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/dashboard");
    }
  }, [status, router]);

  // Update tab when role changes (for admin impersonation)
  useEffect(() => {
    setActiveTab(getDefaultTab(effectiveUser.role));
    setHistoryMode(HistoryFilterMode.ALL);
  }, [effectiveUser.role]);

  // Loading state
  if (status === "loading") {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
        טוען...
      </div>
    );
  }

  // Not authenticated (will redirect)
  if (!session?.user) {
    return null;
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "history") {
      setHistoryMode(HistoryFilterMode.ALL);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "32px",
    border: "1px solid #eaecf0",
    boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
    width: "100%",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: "600",
    color: "#101828",
    margin: "0 0 24px 0",
    fontFamily: "system-ui, -apple-system, sans-serif",
    letterSpacing: "-0.02em",
  };

  /** Shared submitter tabs for Employee and Manager (no duplicated JSX). */
  const renderSubmitterContent = () => {
    if (activeTab === "form") {
      return <AgentForm />;
    }
    if (activeTab === "my-requests") {
      return (
        <RequestQueue
          filter={{ submittedByUserId: effectiveUser.id }}
          title="הבקשות שלי"
          currentUser={effectiveUser}
          showActions={false}
          pageSize={5}
        />
      );
    }
    return null;
  };

  const renderContent = () => {
    const role = effectiveUser.role;

    if (role === UserRole.EMPLOYEE) {
      return (
        renderSubmitterContent() ?? (
          <div style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>
            בחר לשונית
          </div>
        )
      );
    }

    if (role === UserRole.MANAGER) {
      if (activeTab === "pending") {
        return (
          <RequestQueue
            filter={{
              assignedTo: UserRole.MANAGER,
              assignedToUserId: effectiveUser.id,
            }}
            title="ממתין להמלצתי"
            currentUser={effectiveUser}
            showActions={true}
            pageSize={5}
          />
        );
      }
      return (
        renderSubmitterContent() ?? (
          <div style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>
            בחר לשונית
          </div>
        )
      );
    }

    if (role === UserRole.CISO) {
      if (activeTab === "history") {
        return (
          <>
            <HistoryStatusFilters
              current={historyMode}
              onChange={setHistoryMode}
            />
            <RequestQueue
              filter={getHistoryFilterOptions(historyMode)}
              title={getHistoryTitle(historyMode)}
              currentUser={effectiveUser}
              showActions={false}
              pageSize={5}
            />
          </>
        );
      }

      const view = getCisoQueueView(activeTab);
      if (view) {
        return (
          <RequestQueue
            filter={view.filter}
            title={view.title}
            currentUser={effectiveUser}
            showActions={view.showActions}
            pageSize={5}
          />
        );
      }
    }

    return (
      <div style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>
        בחר לשונית
      </div>
    );
  };

  return (
    <>
      <RoleSwitcher />

      <main
        style={{
          padding: "48px 32px",
          display: "grid",
          gap: "40px",
          width: "100%",
          boxSizing: "border-box",
          backgroundColor: "#f8f9fa",
          minHeight: "100vh",
        }}
      >
        <div style={{ width: "100%", display: "grid", gap: "40px" }}>
          <section style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              <h2 style={{ ...titleStyle, margin: 0 }}>
                Agent Approval Management
              </h2>
              <SessionNav />
            </div>

            <DashboardTabs
              currentTab={activeTab}
              onTabChange={handleTabChange}
              role={effectiveUser.role}
            />

            {renderContent()}
          </section>
        </div>

        <footer
          style={{
            backgroundColor: "#0f172a",
            color: "#94a3b8",
            padding: "24px 20px",
            textAlign: "center",
            fontSize: 13,
            lineHeight: 1.6,
            width: "100%",
          }}
        >
          <div
            style={{
              maxWidth: 900,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              alignItems: "center",
            }}
          >
            <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 14 }}>
              נבנה על ידי <span style={{ color: "#38bdf8" }}>LEEH</span>{" "}
              &copy; {new Date().getFullYear()}
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 4,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <span>
                ליצירת קשר ותמיכה: <strong>Shauli Shwartzman</strong>
              </span>
              <span>|</span>
              <span>
                <a
                  href="mailto:shauli.sh321@gmail.com"
                  style={{ color: "#38bdf8", textDecoration: "none" }}
                >
                  shauli.sh321@gmail.com
                </a>
              </span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
