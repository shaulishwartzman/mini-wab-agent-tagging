/**
 * NextAuth.js API route handler for App Router.
 *
 * Handles all authentication routes:
 * - POST /api/auth/signin - Sign in with credentials
 * - POST /api/auth/signout - Sign out
 * - GET /api/auth/session - Get current session
 * - GET /api/auth/csrf - Get CSRF token
 * - GET /api/auth/providers - List available providers
 *
 * @see lib/auth/auth-options.ts - Shared configuration
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
