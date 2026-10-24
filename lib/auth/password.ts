/**
 * Password utilities for authentication and user provisioning.
 *
 * PURPOSE: Generate temporary passwords for newly created users and provide
 * shared hash/verify helpers. User model pre-save also hashes on save;
 * these helpers are for API routes that need passwords before/outside save.
 *
 * @see models/User.ts - pre-save bcrypt hash + comparePassword
 * @see lib/auth/auth-options.ts - login password verification via model method
 */

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

/** Characters used when generating temporary passwords (no ambiguous 0/O/l/1). */
const TEMP_PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

/**
 * Generate a random temporary password for newly created users.
 * Callers should email this value and set `mustChangePassword: true`.
 *
 * @param length - Password length (minimum 10, default 12)
 * @returns Plain-text temporary password
 */
export function generateTempPassword(length = 12): string {
  const size = Math.max(length, 10);
  const bytes = randomBytes(size);
  let password = "";
  for (let i = 0; i < size; i++) {
    password += TEMP_PASSWORD_CHARS[bytes[i]! % TEMP_PASSWORD_CHARS.length];
  }
  return password;
}

/**
 * Hash a plain-text password with bcrypt (salt rounds: 12).
 *
 * @param plainPassword - Plain-text password
 * @returns Bcrypt hash string
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Compare a plain-text password to a bcrypt hash.
 *
 * @param plainPassword - Candidate password
 * @param hashedPassword - Stored bcrypt hash
 * @returns true if the password matches
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
