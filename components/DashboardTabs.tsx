/**
 * DashboardTabs - Role-based tab navigation for the dashboard.
 *
 * Shows different tabs based on the current user's role:
 * - EMPLOYEE: "הגשת בקשה" (form) | "הבקשות שלי" (my requests)
 * - MANAGER: "ממתין להמלצתי" (pending queue only — MVP reviewer role)
 * - CISO: "ממתין לאישור" (pending) | "כל הבקשות" (all)
 *
 * Key UX rule: Only employees see the form. Manager/CISO see queues by default.
 *
 * @see app/page.tsx - Main consumer
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
 */
export const TABS_BY_ROLE: Record<string, Tab[]> = {
  [UserRole.EMPLOYEE]: [
    { id: "form", label: "הגשת בקשה" },
    { id: "my-requests", label: "הבקשות שלי" },
  ],
  [UserRole.MANAGER]: [
    { id: "pending", label: "ממתין להמלצתי" },
  ],
  [UserRole.CISO]: [
    { id: "pending", label: "ממתין לאישור" },
    { id: "all-requests", label: "כל הבקשות" },
  ],
};

/**
 * Get the default tab for a role.
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
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "12px 24px",
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
