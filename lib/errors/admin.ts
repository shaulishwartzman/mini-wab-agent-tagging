/**
 * Hebrew error messages for the System Admin panel and login.
 *
 * Used by:
 * - GET /api/organizations (list all orgs)
 * - GET /api/users?organizationId=... (cross-org user list)
 * - app/admin/page.tsx and AdminDashboard
 * - app/admin/login/page.tsx and AdminLoginForm
 *
 * @see app/api/organizations/route.ts
 * @see components/admin/AdminDashboard.tsx
 * @see components/auth/AdminLoginForm.tsx
 */

export const AdminErrors = {
  /** User is not authenticated. */
  unauthorized: "נדרשת התחברות למערכת.",

  /** User is authenticated but not a SYSTEM_ADMIN. */
  forbidden: "הגישה מותרת למנהלי מערכת בלבד.",

  /** Generic server error. */
  serverError: "שגיאת שרת. נסה שוב מאוחר יותר.",

  /** Organization not found. */
  orgNotFound: "הארגון לא נמצא.",
} as const;

/**
 * UI labels for the admin panel (Hebrew).
 */
export const AdminLabels = {
  /** Page title. */
  pageTitle: "לוח בקרה - מנהל מערכת",

  /** Section header for organizations list. */
  organizationsHeader: "ארגונים",

  /** Column headers for organizations table. */
  orgTableHeaders: {
    name: "שם הארגון",
    slug: "מזהה",
    userCount: "משתמשים",
    createdAt: "תאריך יצירה",
    actions: "פעולות",
  },

  /** Button text. */
  viewDetails: "צפייה",
  viewUsers: "משתמשים",
  viewRequests: "בקשות",
  backToList: "חזרה לרשימה",

  /** Empty state messages. */
  noOrganizations: "אין ארגונים במערכת.",
  noUsersInOrg: "אין משתמשים בארגון זה.",
  noRequestsInOrg: "אין בקשות בארגון זה.",

  /** Loading state. */
  loading: "טוען...",
} as const;

/**
 * Hebrew error messages for admin login form.
 */
export const AdminLoginErrors = {
  /** Invalid email or password. */
  credentialsFailed: "אימייל או סיסמה שגויים.",

  /** Unexpected error during login. */
  unexpected: "שגיאה בלתי צפויה. נסה שוב.",
} as const;
