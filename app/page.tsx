/**
 * Main page for the AI Governance & Agent Risk Assessment Platform.
 *
 * Role-based dashboard with conditional content:
 * - EMPLOYEE: Form + My Requests
 * - MANAGER: Pending Recommendations only (MVP reviewer role)
 * - CISO: Quick filter tabs —
 *   ממתין לטיפולי | בקשות פעילות | היסטוריית אישורים
 *   History supports sub-filters: הכל / מאושרות / נדחו
 *
 * @see components/RoleSwitcher.tsx - Role switching UI (MVP testing)
 * @see components/DashboardTabs.tsx - Tab navigation
 * @see components/HistoryStatusFilters.tsx - History sub-filter buttons
 * @see components/RequestQueue.tsx - Request lists with pagination
 * @see lib/utils/dashboardFilters.ts - CISO queue filter presets
 * @see components/AgentForm.tsx - Questionnaire form (employees only)
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AgentForm from "@/components/AgentForm";
import { RoleSwitcher } from "@/components/RoleSwitcher";
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

export default function Page() {
  const { currentUser } = useRole();
  const [activeTab, setActiveTab] = useState(() =>
    getDefaultTab(currentUser.role)
  );
  const [historyMode, setHistoryMode] = useState<HistoryFilterModeType>(
    HistoryFilterMode.ALL
  );

  useEffect(() => {
    setActiveTab(getDefaultTab(currentUser.role));
    setHistoryMode(HistoryFilterMode.ALL);
  }, [currentUser.role]);

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

  const renderContent = () => {
    const role = currentUser.role;

    if (role === UserRole.EMPLOYEE) {
      if (activeTab === "form") {
        return <AgentForm />;
      }
      if (activeTab === "my-requests") {
        return (
          <RequestQueue
            filter={{ submittedByUserId: currentUser.id }}
            title="הבקשות שלי"
            showActions={false}
          />
        );
      }
    }

    if (role === UserRole.MANAGER) {
      return (
        <RequestQueue
          filter={{
            assignedTo: UserRole.MANAGER,
            assignedToUserId: currentUser.id,
          }}
          title="ממתין להמלצתי"
          showActions={true}
        />
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
              showActions={false}
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
            showActions={view.showActions}
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
              {currentUser.role === UserRole.CISO && (
                <Link
                  href="/green-path"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#f8fafc",
                    color: "#1e40af",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  הגדרות נתיב ירוק
                </Link>
              )}
            </div>

            <DashboardTabs
              currentTab={activeTab}
              onTabChange={handleTabChange}
              role={currentUser.role}
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
