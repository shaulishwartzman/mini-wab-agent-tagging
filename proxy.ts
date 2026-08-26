/**
 * Next.js proxy (formerly middleware) for route protection and auth gates.
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy`.
 * This file runs at the network boundary before the app handles the request.
 *
 * Behavior:
 * - Public: /, /login, /register-org, /admin/login, /forgot-password, /api/auth/*, /api/organizations
 * - Auth-required: All other routes (dashboard, users, admin, green-path, APIs)
 * - Role gates: /admin → SYSTEM_ADMIN; /users → CISO | MANAGER | SYSTEM_ADMIN
 * - Forced password change when JWT has mustChangePassword === true
 *
 * Uses NextAuth JWT from cookies (`getToken`) — no MongoDB in the edge/proxy layer.
 *
 * @see lib/auth/auth-options.ts - JWT/session fields
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/lib/types";

/**
 * Always public — no session required.
 */
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register-org",
  "/admin/login",
  "/forgot-password",
  "/api/auth",
  "/api/organizations",
];

/**
 * Routes that explicitly require auth (for clarity; all non-public routes
 * require auth after the MVP transitional phase was removed).
 */
const AUTH_REQUIRED_ROUTES = [
  "/dashboard",
  "/users",
  "/admin",
  "/change-password",
  "/green-path",
  "/api/requests",
  "/api/green-path-settings",
  "/api/agent",
  "/api/send-email",
];

/** SYSTEM_ADMIN only. */
const ADMIN_ROUTES = ["/admin"];

/** CISO, MANAGER, or SYSTEM_ADMIN. */
const USER_MANAGEMENT_ROUTES = ["/users"];

/**
 * Check if a pathname matches any route prefix in the list.
 *
 * @param pathname - Request pathname
 * @param routes - Route prefixes to match
 * @returns true when pathname equals or is nested under a route
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * Proxy entry point — auth gate for incoming requests.
 *
 * @param request - Incoming Next.js request
 * @returns NextResponse (continue, or redirect to login / home / change-password)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets / Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Always-public routes
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Unauthenticated: redirect to login for all protected routes
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Force password change before using the rest of the app
  if (token.mustChangePassword && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  if (pathname === "/change-password") {
    return NextResponse.next();
  }

  if (matchesRoute(pathname, ADMIN_ROUTES)) {
    if (token.role !== UserRole.SYSTEM_ADMIN) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (matchesRoute(pathname, USER_MANAGEMENT_ROUTES)) {
    if (
      token.role !== UserRole.CISO &&
      token.role !== UserRole.MANAGER &&
      token.role !== UserRole.SYSTEM_ADMIN
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Matcher — run proxy on app/API routes; skip static assets.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
