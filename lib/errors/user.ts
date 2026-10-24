/**
 * User-facing Hebrew messages for user management.
 *
 * PURPOSE: Keep user creation/listing error messages in one place
 * (same pattern as `lib/errors/auth.ts` for login / password).
 *
 * @see app/api/users/route.ts - GET/POST endpoints
 * @see app/users/page.tsx - User management UI
 */

import { UserRole } from "@/lib/types";

/** User management API and UI messages. */
export const UserErrors = {
  // Auth errors
  unauthorized: "יש להתחבר כדי לצפות במשתמשים.",
  forbidden: "אין לך הרשאה לצפות במשתמשים.",
  cannotCreateUsers: "אין לך הרשאה ליצור משתמשים.",

  // Validation errors (400)
  missingEmail: "יש להזין כתובת אימייל.",
  missingName: "יש להזין שם המשתמש.",
  missingRole: "יש לבחור תפקיד.",
  invalidEmail: "כתובת האימייל אינה תקינה.",
  invalidRole: "התפקיד שנבחר אינו תקין.",
  noOrganization: "לא נמצא ארגון משויך.",
  adminNeedsOrg: "יש לציין ארגון ליצירת משתמש.",

  // Not found (404)
  orgNotFound: "הארגון לא נמצא.",

  // Conflict errors (409)
  emailExists: "כתובת האימייל כבר קיימת בארגון זה.",

  // Server errors (500)
  serverError: "אירעה שגיאת שרת. נסו שוב מאוחר יותר.",

  // Success
  successMessage: "המשתמש נוצר בהצלחה. סיסמה זמנית נשלחה לאימייל.",

  // Dynamic messages
  cannotCreateRole: (role: string): string => {
    const roleLabels: Record<string, string> = {
      [UserRole.EMPLOYEE]: "עובד",
      [UserRole.MANAGER]: "מנהל",
      [UserRole.CISO]: "CISO",
    };
    const label = roleLabels[role] ?? role;
    return `אין לך הרשאה ליצור משתמש בתפקיד ${label}.`;
  },
} as const;

/** Role display labels in Hebrew. */
export const RoleLabels: Record<string, string> = {
  [UserRole.EMPLOYEE]: "עובד",
  [UserRole.MANAGER]: "מנהל",
  [UserRole.CISO]: "CISO",
  [UserRole.SYSTEM_ADMIN]: "מנהל מערכת",
};

/** Get Hebrew label for a role. */
export function getRoleLabel(role: string): string {
  return RoleLabels[role] ?? role;
}
