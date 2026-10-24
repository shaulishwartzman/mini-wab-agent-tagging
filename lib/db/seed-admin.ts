/**
 * Auto-seed SYSTEM_ADMIN from environment variables.
 *
 * If SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are set, creates a SYSTEM_ADMIN
 * user on first app startup (idempotent - won't overwrite existing admin).
 *
 * Called automatically from connectDB() after successful MongoDB connection.
 *
 * Environment variables:
 *   SEED_ADMIN_EMAIL    - Admin email address
 *   SEED_ADMIN_PASSWORD - Admin password (will be bcrypt hashed)
 *   SEED_ADMIN_NAME     - Admin display name (optional, defaults to "System Admin")
 *
 * @see lib/db/mongodb.ts - Calls this after connection
 * @see scripts/seed-admin.ts - CLI alternative
 */

import mongoose from "mongoose";

let seeded = false;

/**
 * Seed SYSTEM_ADMIN from environment variables if configured.
 *
 * This function is idempotent:
 * - Only runs once per app lifecycle (tracks via module-level flag)
 * - Only creates admin if one with that email doesn't exist
 *
 * @returns Promise that resolves when seeding is complete or skipped
 */
export async function seedAdminFromEnv(): Promise<void> {
  if (seeded) {
    return;
  }
  seeded = true;

  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME?.trim() || "System Admin";

  if (!email || !password) {
    return;
  }

  if (password.length < 8) {
    console.warn(
      "[seed-admin] SEED_ADMIN_PASSWORD must be at least 8 characters. Skipping."
    );
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.warn("[seed-admin] SEED_ADMIN_EMAIL is not a valid email. Skipping.");
    return;
  }

  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.warn("[seed-admin] Database connection not ready. Skipping.");
      return;
    }

    const existingAdmin = await db.collection("users").findOne({
      email: email.toLowerCase(),
      organizationId: null,
      role: "SYSTEM_ADMIN",
    });

    if (existingAdmin) {
      console.log(`[seed-admin] SYSTEM_ADMIN "${email}" already exists.`);
      return;
    }

    const bcryptModule = await import("bcryptjs");
    const bcrypt = bcryptModule.default ?? bcryptModule;

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const now = new Date();
    await db.collection("users").insertOne({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: "SYSTEM_ADMIN",
      organizationId: null,
      mustChangePassword: false,
      createdBy: null,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`[seed-admin] Created SYSTEM_ADMIN: ${email}`);
  } catch (err) {
    console.error("[seed-admin] Failed to seed admin:", err);
  }
}
