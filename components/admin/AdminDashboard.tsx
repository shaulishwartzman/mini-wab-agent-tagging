"use client";

/**
 * System Admin Dashboard component.
 *
 * Features:
 * - View all organizations with user counts
 * - Drill-down to view users in any organization (read-only)
 * - View agent requests for any organization (via link to dashboard)
 *
 * Only accessible to SYSTEM_ADMIN users.
 *
 * @see app/admin/page.tsx - Server wrapper
 * @see app/api/organizations/route.ts - GET organizations list
 * @see app/api/users/route.ts - GET users by organizationId
 * @see lib/errors/admin.ts - Hebrew labels and errors
 */

import { useCallback, useEffect, useState } from "react";
import { AdminLabels } from "@/lib/errors/admin";
import { getRoleLabel } from "@/lib/errors/user";
import { Pagination } from "@/components/Pagination";

interface Organization {
  id: string;
  name: string;
  slug: string;
  userCount: number;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
  createdAt: string;
}

type ViewMode = "list" | "users";

/**
 * AdminDashboard - System-wide organization management.
 */
export function AdminDashboard() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Drill-down state
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Fetch organizations on mount
  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await fetch("/api/organizations");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to fetch organizations");
        }
        const data = await res.json();
        setOrganizations(data.organizations);
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאה בטעינת נתונים");
      } finally {
        setLoading(false);
      }
    }
    fetchOrgs();
  }, []);

  // Fetch users for a specific org
  const fetchOrgUsers = useCallback(async (orgId: string) => {
    setUsersLoading(true);
    try {
      const res = await fetch(`/api/users?organizationId=${orgId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to fetch users");
      }
      const data = await res.json();
      setOrgUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בטעינת משתמשים");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Handle view users click
  const handleViewUsers = (org: Organization) => {
    setSelectedOrg(org);
    setViewMode("users");
    fetchOrgUsers(org.id);
  };

  // Handle back to list
  const handleBackToList = () => {
    setViewMode("list");
    setSelectedOrg(null);
    setOrgUsers([]);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={loadingStyle} dir="rtl">
        {AdminLabels.loading}
      </div>
    );
  }

  if (error) {
    return (
      <div style={errorStyle} dir="rtl">
        {error}
      </div>
    );
  }

  // Users view for selected organization
  if (viewMode === "users" && selectedOrg) {
    return (
      <div dir="rtl">
        <button
          type="button"
          onClick={handleBackToList}
          style={backButtonStyle}
        >
          ← {AdminLabels.backToList}
        </button>

        <h2 style={sectionHeaderStyle}>
          משתמשי {selectedOrg.name}
        </h2>

        {usersLoading ? (
          <div style={loadingStyle}>{AdminLabels.loading}</div>
        ) : orgUsers.length === 0 ? (
          <div style={emptyStateStyle}>{AdminLabels.noUsersInOrg}</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>שם</th>
                <th style={thStyle}>אימייל</th>
                <th style={thStyle}>תפקיד</th>
                <th style={thStyle}>סטטוס</th>
                <th style={thStyle}>תאריך יצירה</th>
              </tr>
            </thead>
            <tbody>
              {orgUsers.map((user) => (
                <tr key={user.id} style={trStyle}>
                  <td style={tdStyle}>{user.name}</td>
                  <td style={tdStyle}>{user.email}</td>
                  <td style={tdStyle}>
                    <span style={getRoleBadgeStyle(user.role)}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {user.mustChangePassword ? (
                      <span style={pendingBadgeStyle}>ממתין לשינוי סיסמה</span>
                    ) : (
                      <span style={activeBadgeStyle}>פעיל</span>
                    )}
                  </td>
                  <td style={tdStyle}>{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  // Main organizations list view
  // Pagination calculations
  const totalPages = Math.ceil(organizations.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrgs = organizations.slice(startIndex, endIndex);

  return (
    <div dir="rtl">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ ...sectionHeaderStyle, margin: 0 }}>
          {AdminLabels.organizationsHeader}
        </h2>
        <a
          href="/dashboard"
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #3b82f6",
            backgroundColor: "#eff6ff",
            color: "#1e40af",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          לוח הבקרה (התחזות לתפקיד)
        </a>
      </div>

      {organizations.length === 0 ? (
        <div style={emptyStateStyle}>{AdminLabels.noOrganizations}</div>
      ) : (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>{AdminLabels.orgTableHeaders.name}</th>
                <th style={thStyle}>{AdminLabels.orgTableHeaders.slug}</th>
                <th style={thStyle}>{AdminLabels.orgTableHeaders.userCount}</th>
                <th style={thStyle}>{AdminLabels.orgTableHeaders.createdAt}</th>
                <th style={thStyle}>{AdminLabels.orgTableHeaders.actions}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrgs.map((org) => (
                <tr key={org.id} style={trStyle}>
                  <td style={tdStyle}>
                    <strong>{org.name}</strong>
                  </td>
                  <td style={tdStyle}>
                    <code style={slugStyle}>{org.slug}</code>
                  </td>
                  <td style={tdStyle}>{org.userCount}</td>
                  <td style={tdStyle}>{formatDate(org.createdAt)}</td>
                  <td style={tdStyle}>
                    <button
                      type="button"
                      onClick={() => handleViewUsers(org)}
                      style={actionButtonStyle}
                    >
                      {AdminLabels.viewUsers}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={organizations.length}
              onPageChange={setPage}
              disabled={loading}
            />
          )}
        </>
      )}

      <div style={statsStyle}>
        <span>סה״כ ארגונים: {organizations.length}</span>
        <span style={{ marginRight: 16 }}>
          סה״כ משתמשים: {organizations.reduce((sum, o) => sum + o.userCount, 0)}
        </span>
      </div>
    </div>
  );
}

// Styles
const loadingStyle: React.CSSProperties = {
  padding: 32,
  textAlign: "center",
  color: "#64748b",
};

const errorStyle: React.CSSProperties = {
  padding: 16,
  backgroundColor: "#fef2f2",
  color: "#dc2626",
  borderRadius: 8,
  textAlign: "center",
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "#1e293b",
  marginBottom: 16,
};

const emptyStateStyle: React.CSSProperties = {
  padding: 32,
  textAlign: "center",
  color: "#94a3b8",
  backgroundColor: "#f8fafc",
  borderRadius: 8,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  backgroundColor: "#ffffff",
  borderRadius: 8,
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "right",
  backgroundColor: "#f1f5f9",
  fontWeight: 600,
  color: "#475569",
  fontSize: 13,
  borderBottom: "1px solid #e2e8f0",
};

const trStyle: React.CSSProperties = {
  borderBottom: "1px solid #f1f5f9",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 14,
  color: "#334155",
};

const slugStyle: React.CSSProperties = {
  backgroundColor: "#f1f5f9",
  padding: "2px 8px",
  borderRadius: 4,
  fontSize: 12,
  color: "#64748b",
};

const actionButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  fontSize: 13,
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 500,
};

const backButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: 14,
  backgroundColor: "#f1f5f9",
  color: "#475569",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  cursor: "pointer",
  marginBottom: 16,
};

const statsStyle: React.CSSProperties = {
  marginTop: 16,
  padding: 12,
  backgroundColor: "#f8fafc",
  borderRadius: 8,
  fontSize: 13,
  color: "#64748b",
  textAlign: "center",
};

const getRoleBadgeStyle = (role: string): React.CSSProperties => {
  const colors: Record<string, { bg: string; text: string }> = {
    CISO: { bg: "#fef3c7", text: "#92400e" },
    MANAGER: { bg: "#dbeafe", text: "#1e40af" },
    EMPLOYEE: { bg: "#f1f5f9", text: "#475569" },
  };
  const { bg, text } = colors[role] ?? colors.EMPLOYEE;
  return {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    backgroundColor: bg,
    color: text,
  };
};

const pendingBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 500,
  backgroundColor: "#fef9c3",
  color: "#854d0e",
};

const activeBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 500,
  backgroundColor: "#dcfce7",
  color: "#166534",
};
