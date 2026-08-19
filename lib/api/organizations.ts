/**
 * Client-side helpers for organization registration API.
 *
 * `POST /api/organizations` is implemented in Step 4 of the user-management plan.
 * This helper is ready so the register-org page can call it now.
 * Success requires JSON `{ organization: { slug } }` — HTML/redirects are not success.
 *
 * @see components/auth/RegisterOrgForm.tsx
 */

import {
  RegisterOrgErrors,
  resolveAuthError,
} from "@/lib/errors/auth";

export type RegisterOrganizationPayload = {
  /** Organization display name. */
  name: string;
  /** First CISO full name. */
  cisoName: string;
  /** First CISO email (receives temporary password). */
  cisoEmail: string;
};

export type RegisterOrganizationResult = {
  success: boolean;
  error?: string;
  organizationSlug?: string;
};

/**
 * Register a new organization with its first CISO user.
 *
 * @param payload - Org name + first CISO details
 * @returns Success flag and optional error / slug
 */
export async function registerOrganization(
  payload: RegisterOrganizationPayload,
): Promise<RegisterOrganizationResult> {
  const res = await fetch("/api/organizations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    redirect: "manual",
  });

  if (res.status === 404 || res.status === 0 || res.type === "opaqueredirect") {
    return {
      success: false,
      error: RegisterOrgErrors.apiUnavailable,
    };
  }

  if (res.status >= 300 && res.status < 400) {
    return {
      success: false,
      error: RegisterOrgErrors.apiUnavailable,
    };
  }

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? ((await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        organization?: { slug?: string };
      })
    : {};

  if (!res.ok) {
    return {
      success: false,
      error: resolveAuthError(
        data.error || data.message,
        res.status === 404
          ? RegisterOrgErrors.apiUnavailable
          : RegisterOrgErrors.failed,
      ),
    };
  }

  if (!data.organization) {
    return {
      success: false,
      error: RegisterOrgErrors.apiUnavailable,
    };
  }

  return {
    success: true,
    organizationSlug: data.organization.slug,
  };
}
