/**
 * Shared JSON helpers for Next.js API route responses.
 *
 * PURPOSE: Avoid repeating `NextResponse.json({ error }, { status })`
 * across auth and org APIs.
 *
 * @see app/api/auth/change-password/route.ts
 */

import { NextResponse } from "next/server";

/**
 * JSON error body `{ error: message }` with an HTTP status code.
 *
 * @param message - User-facing error string (typically Hebrew)
 * @param status - HTTP status (e.g. 400, 401, 404, 500)
 * @returns NextResponse ready to return from a route handler
 */
export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * JSON success body with optional HTTP status (default 200).
 *
 * @param body - Serializable payload
 * @param status - HTTP status
 * @returns NextResponse ready to return from a route handler
 */
export function jsonOk(
  body: Record<string, unknown>,
  status = 200,
): NextResponse {
  return NextResponse.json(body, { status });
}
