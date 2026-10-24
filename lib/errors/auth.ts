/**
 * User-facing Hebrew messages for authentication UI flows.
 *
 * PURPOSE: Keep login / register-org / change-password copy in one place
 * (same pattern as `lib/errors/authorization.ts` for request workflow 403s).
 *
 * Forms and client helpers import constants or small resolvers from here
 * instead of hard-coding strings in components.
 *
 * @see components/auth/LoginForm.tsx
 * @see components/auth/RegisterOrgForm.tsx
 * @see components/auth/ChangePasswordForm.tsx
 * @see lib/api/auth.ts
 * @see lib/api/organizations.ts
 * @see app/api/organizations/route.ts
 */

/** Login form messages. */
export const LoginErrors = {
  invalidOrganizationName: "שם הארגון אינו תקין. השתמשו באותיות ומספרים.",
  credentialsFailed:
    "ההתחברות נכשלה. בדקו שם ארגון, אימייל וסיסמה ונסו שוב.",
  unexpected: "אירעה שגיאה בלתי צפויה. נסו שוב מאוחר יותר.",
} as const;

/** Organization registration form / API client messages. */
export const RegisterOrgErrors = {
  invalidOrganizationName: "שם הארגון אינו תקין. השתמשו באותיות ומספרים.",
  apiUnavailable: "שירות רישום הארגון אינו זמין כרגע.",
  failed: "רישום הארגון נכשל.",
  failedRetry: "הרישום נכשל. נסו שוב.",
  unexpected: "אירעה שגיאה בלתי צפויה. נסו שוב מאוחר יותר.",
} as const;

/** Organization registration API messages (`POST /api/organizations`). */
export const OrganizationErrors = {
  missingName: "יש להזין שם ארגון.",
  missingCisoName: "יש להזין שם ה-CISO הראשון.",
  missingCisoEmail: "יש להזין כתובת אימייל של ה-CISO.",
  invalidCisoEmail: "כתובת האימייל אינה תקינה.",
  invalidName: "שם הארגון אינו תקין. השתמשו באותיות ומספרים.",
  slugExists: "ארגון עם שם דומה כבר קיים במערכת.",
  emailExists: "כתובת האימייל כבר קיימת בארגון אחר.",
  serverError: "אירעה שגיאת שרת. נסו שוב מאוחר יותר.",
  successMessage:
    "הארגון נרשם בהצלחה. סיסמה זמנית נשלחה לאימייל ה-CISO.",
} as const;

/** Password change form / API client messages. */
export const ChangePasswordErrors = {
  unauthorized: "יש להתחבר כדי לשנות סיסמה.",
  missingFields: "יש למלא סיסמה נוכחית וסיסמה חדשה.",
  tooShort: "הסיסמה החדשה חייבת להכיל לפחות 8 תווים.",
  mismatch: "הסיסמה החדשה ואימות הסיסמה אינם תואמים.",
  sameAsCurrent: "הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית.",
  userNotFound: "המשתמש לא נמצא.",
  wrongCurrent: "הסיסמה הנוכחית שגויה.",
  failed: "עדכון הסיסמה נכשל.",
  unexpected: "אירעה שגיאה בלתי צפויה. נסו שוב.",
  serverError: "שגיאת שרת בעדכון הסיסמה.",
  success: "הסיסמה עודכנה בהצלחה.",
} as const;

/** Forgot password form / API client messages. */
export const ForgotPasswordErrors = {
  missingFields: "נא למלא את כל השדות / Please fill all fields",
  invalidEmail: "כתובת מייל לא תקינה / Invalid email address",
  requestSent:
    "אם המייל קיים במערכת, נשלח קישור לאיפוס סיסמה / If email exists, reset link sent",
  rateLimitExceeded:
    "יותר מדי בקשות. נסו שוב בעוד דקה / Too many requests. Try again in 1 minute",
  serverError: "שגיאת שרת / Server error",
} as const;

/** Reset password form / API client messages. */
export const ResetPasswordErrors = {
  missingFields: "נא למלא את כל השדות / Please fill all fields",
  invalidToken:
    "קישור לא תקין או פג תוקפו / Invalid or expired reset link",
  passwordTooShort:
    "הסיסמה חייבת להיות לפחות 8 תווים / Password must be at least 8 characters",
  passwordsDoNotMatch: "הסיסמאות אינן זהות / Passwords do not match",
  success: "הסיסמה עודכנה בהצלחה / Password reset successful",
  serverError: "שגיאת שרת / Server error",
} as const;

/**
 * Prefer an API-provided message; otherwise use the fallback constant.
 *
 * @param apiMessage - Optional error from the server / fetch helper
 * @param fallback - Localized fallback from this module
 * @returns Message safe to show in an AuthErrorBanner
 */
export function resolveAuthError(
  apiMessage: string | undefined,
  fallback: string,
): string {
  const trimmed = apiMessage?.trim();
  return trimmed ? trimmed : fallback;
}
