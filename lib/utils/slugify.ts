/**
 * URL-safe slug helpers for organization identifiers.
 *
 * Used by organization registration (auto-slug) and login (name → slug).
 * Supports Unicode letters so Hebrew organization names produce valid slugs.
 *
 * @see models/Organization.ts - Persists slug on save
 * @see components/auth/LoginForm.tsx - Converts org name input to slug
 */

/**
 * Convert a display name into a URL-safe slug.
 *
 * @param input - Organization name or free-text identifier
 * @returns Lowercase slug with hyphens (may be empty if input has no letters/digits)
 *
 * @example
 * slugify("Hadassah Academic College") // "hadassah-academic-college"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
