"use client";

/**
 * Client component for user management — list + create form.
 *
 * Features:
 * - Fetches and displays users in the organization
 * - Form to create new users (role-based permissions)
 * - Temporary password displayed after creation (MVP)
 *
 * @see app/users/page.tsx - Server component wrapper
 * @see app/api/users/route.ts - API endpoints
 */

import { useEffect, useState, FormEvent } from "react";
import { UserRole, OrgBoundRoles } from "@/lib/types";
import { getRoleLabel, UserErrors } from "@/lib/errors/user";
import { canCreateRole } from "@/lib/auth/permissions";
import { Pagination } from "@/components/Pagination";

/** User shape returned from API. */
interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
  createdAt: string;
}

interface Props {
  currentUserRole: string;
  organizationId: string | null;
}

/**
 * User management UI — list users and add new ones.
 */
export function UserManagementClient({ currentUserRole, organizationId }: Props) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const pageSize = 5;

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<string>(UserRole.EMPLOYEE);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Fetch users on mount and page change
  useEffect(() => {
    fetchUsers();
  }, [page]);

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || UserErrors.serverError);
        return;
      }
      const allUsers = data.users ?? [];
      setTotalUsers(allUsers.length);
      setTotalPages(Math.ceil(allUsers.length / pageSize));
      
      // Paginate on client side
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      setUsers(allUsers.slice(start, end));
    } catch {
      setError(UserErrors.serverError);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFormLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formEmail.trim(),
          name: formName.trim(),
          role: formRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || UserErrors.serverError);
        setFormLoading(false);
        return;
      }

      setFormSuccess(
        `המשתמש ${data.user?.name ?? formName} נוצר בהצלחה. סיסמה זמנית נשלחה לאימייל (ראו קונסול השרת).`
      );
      setFormEmail("");
      setFormName("");
      setFormRole(UserRole.EMPLOYEE);
      setFormOpen(false);
      setPage(1); // Reset to first page
      fetchUsers();
    } catch {
      setFormError(UserErrors.serverError);
    } finally {
      setFormLoading(false);
    }
  }

  // Determine which roles the current user can create
  const creatableRoles = OrgBoundRoles.filter((role) =>
    canCreateRole(currentUserRole, role)
  );

  return (
    <div dir="rtl">
      {/* Success banner */}
      {formSuccess && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#dcfce7",
            border: "1px solid #86efac",
            borderRadius: 8,
            marginBottom: 16,
            color: "#166534",
            fontSize: 14,
          }}
        >
          {formSuccess}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            marginBottom: 16,
            color: "#dc2626",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Add user button */}
      {creatableRoles.length > 0 && !formOpen && (
        <button
          onClick={() => setFormOpen(true)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          + הוספת משתמש
        </button>
      )}

      {/* Add user form */}
      {formOpen && (
        <div
          style={{
            padding: 20,
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              margin: "0 0 16px",
              color: "#1e293b",
            }}
          >
            הוספת משתמש חדש
          </h2>

          {formError && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 6,
                marginBottom: 14,
                color: "#dc2626",
                fontSize: 13,
              }}
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateUser} style={{ display: "grid", gap: 14 }}>
            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 6,
                  color: "#374151",
                }}
              >
                אימייל
              </label>
              <input
                id="email"
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                onBlur={(e) => setFormEmail(e.target.value.trim())}
                placeholder="user@company.com"
                dir="ltr"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="name"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 6,
                  color: "#374151",
                }}
              >
                שם מלא
              </label>
              <input
                id="name"
                type="text"
                required
                minLength={2}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onBlur={(e) => setFormName(e.target.value.trim())}
                placeholder="שם המשתמש"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="role"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 6,
                  color: "#374151",
                }}
              >
                תפקיד
              </label>
              <select
                id="role"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  backgroundColor: "white",
                  boxSizing: "border-box",
                }}
              >
                {creatableRoles.map((role) => (
                  <option key={role} value={role}>
                    {getRoleLabel(role)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="submit"
                disabled={formLoading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: formLoading ? "wait" : "pointer",
                  opacity: formLoading ? 0.7 : 1,
                }}
              >
                {formLoading ? "יוצר..." : "צור משתמש"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  setFormError("");
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "transparent",
                  color: "#64748b",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users list */}
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
          }}
        >
          <h2
            style={{
              fontSize: 15,
              fontWeight: 600,
              margin: 0,
              color: "#1e293b",
            }}
          >
            משתמשים בארגון ({users.length})
          </h2>
        </div>

        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#64748b",
              fontSize: 14,
            }}
          >
            טוען משתמשים...
          </div>
        ) : users.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "#64748b",
              fontSize: 14,
            }}
          >
            אין משתמשים בארגון
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#475569",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  שם
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#475569",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  אימייל
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#475569",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  תפקיד
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#475569",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  סטטוס
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#475569",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  נוצר
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f1f5f9",
                      color: "#1e293b",
                      fontWeight: 500,
                    }}
                  >
                    {u.name}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f1f5f9",
                      color: "#475569",
                    }}
                    dir="ltr"
                  >
                    {u.email}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <RoleBadge role={u.role} />
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    {u.mustChangePassword ? (
                      <span
                        style={{
                          fontSize: 12,
                          padding: "3px 8px",
                          borderRadius: 4,
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                        }}
                      >
                        ממתין להחלפת סיסמה
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 12,
                          padding: "3px 8px",
                          borderRadius: 4,
                          backgroundColor: "#dcfce7",
                          color: "#166534",
                        }}
                      >
                        פעיל
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f1f5f9",
                      color: "#64748b",
                      fontSize: 13,
                    }}
                    dir="ltr"
                  >
                    {new Date(u.createdAt).toLocaleDateString("he-IL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalUsers}
            onPageChange={setPage}
            disabled={loading}
          />
        )}
      </div>

      {/* Back to dashboard button */}
      <div style={{ marginTop: 20 }}>
        <a
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #3b82f6",
            backgroundColor: "#eff6ff",
            color: "#1e40af",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#dbeafe";
            e.currentTarget.style.borderColor = "#2563eb";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#eff6ff";
            e.currentTarget.style.borderColor = "#3b82f6";
          }}
        >
          ← חזרה ללוח הבקרה
        </a>
      </div>
    </div>
  );
}

/** Role badge with color coding. */
function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    [UserRole.CISO]: { bg: "#dbeafe", text: "#1e40af" },
    [UserRole.MANAGER]: { bg: "#f3e8ff", text: "#7c3aed" },
    [UserRole.EMPLOYEE]: { bg: "#f1f5f9", text: "#475569" },
    [UserRole.SYSTEM_ADMIN]: { bg: "#fef3c7", text: "#92400e" },
  };

  const style = colors[role] ?? colors[UserRole.EMPLOYEE];

  return (
    <span
      style={{
        fontSize: 12,
        padding: "3px 10px",
        borderRadius: 4,
        backgroundColor: style.bg,
        color: style.text,
        fontWeight: 500,
      }}
    >
      {getRoleLabel(role)}
    </span>
  );
}

