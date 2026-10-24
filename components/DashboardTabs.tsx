/**
 * DashboardTabs - Role-based tab navigation for the dashboard.
 *
 * Shows different tabs based on the current user's role:
 * - EMPLOYEE: "הגשת בקשה" | "הבקשות שלי"
 * - MANAGER: "הגשת בקשה" | "הבקשות שלי" | "ממתין להמלצתי"
 * - CISO: filter navigation for oversight queues:
 *   - ממתין לטיפולי — needs CISO action now (`assignedTo=CISO`)
 *   - בקשות פעילות — open pipeline (`PENDING_CISO` + `PENDING_MANAGER`)
 *   - היסטוריית אישורים — terminal requests (`APPROVED` | `REJECTED` | `AUTO_APPROVED`)
 *
 * Removed (replaced by history): כל הבקשות, אושרו אוטומטית.
 *
 * @see app/page.tsx - Main consumer
 * @see lib/utils/dashboardFilters.ts - CISO tab → API filter mapping
 */

"use client";

import { UserRole } from "@/lib/types";

/**
 * Tab definition.
 */
export type Tab = {
  id: string;
  label: string;
};

/**
 * Tabs configuration per role.
 *
 * Employee and Manager share submit + my-requests; Manager adds review inbox.
 * CISO tabs are quick filters (not separate pages).
 */
export const TABS_BY_ROLE: Record<string, Tab[]> = {
  [UserRole.EMPLOYEE]: [
    { id: "form", label: "הגשת בקשה" },
    { id: "my-requests", label: "הבקשות שלי" },
  ],
  [UserRole.MANAGER]: [
    { id: "form", label: "הגשת בקשה" },
    { id: "my-requests", label: "הבקשות שלי" },
    { id: "pending", label: "ממתין להמלצתי" },
  ],
  [UserRole.CISO]: [
    { id: "pending", label: "ממתין לטיפולי" },
    { id: "active", label: "בקשות פעילות" },
    { id: "history", label: "היסטוריית אישורים" },
  ],
};

/**
 * Get the default tab for a role.
 *
 * @param role - Current user role string
 * @returns First tab id for that role
 */
export function getDefaultTab(role: string): string {
  const tabs = TABS_BY_ROLE[role];
  return tabs?.[0]?.id || "form";
}

export type DashboardTabsProps = {
  /** Current active tab ID. */
  currentTab: string;
  /** Callback when tab changes. */
  onTabChange: (tabId: string) => void;
  /** Current user's role (determines which tabs are shown). */
  role: (typeof UserRole)[keyof typeof UserRole];
};

/**
 * Tab navigation component.
 *
 * @example
 * ```tsx
 * <DashboardTabs
 *   currentTab={activeTab}
 *   onTabChange={setActiveTab}
 *   role={currentUser.role}
 * />
 * ```
 */
export function DashboardTabs({
  currentTab,
  onTabChange,
  role,
}: DashboardTabsProps) {
  const tabs = TABS_BY_ROLE[role] || TABS_BY_ROLE[UserRole.EMPLOYEE];

  const containerStyle: React.CSSProperties = {
    display: "flex",
    gap: "0",
    borderBottom: "2px solid #e2e8f0",
    marginBottom: "24px",
    direction: "rtl",
    flexWrap: "wrap",
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "12px 20px",
    border: "none",
    borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent",
    marginBottom: "-2px",
    backgroundColor: "transparent",
    color: isActive ? "#3b82f6" : "#64748b",
    fontSize: "15px",
    fontWeight: isActive ? 600 : 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
  });

  return (
    <nav style={containerStyle} role="tablist" aria-label="Dashboard navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={currentTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          style={tabStyle(currentTab === tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
