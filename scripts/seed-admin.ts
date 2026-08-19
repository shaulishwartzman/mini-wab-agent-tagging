#!/usr/bin/env npx tsx
/**
 * CLI script to create a SYSTEM_ADMIN user.
 *
 * Usage:
 *   npm run seed:admin -- --email admin@example.com --password SecurePass123!
 *   npm run seed:admin  (interactive prompts)
 *
 * Environment:
 *   Requires MONGODB_URI in .env.local
 *
 * @see lib/db/mongodb.ts - Database connection
 * @see models/User.ts - User model
 */

import mongoose from "mongoose";
import * as readline from "readline";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI. Add it to .env.local");
  process.exit(1);
}

/**
 * Parsed command-line arguments for the seed script.
 */
interface ParsedArgs {
  /** Admin email address from --email flag */
  email?: string;
  /** Admin password from --password flag */
  password?: string;
  /** Admin display name from --name flag */
  name?: string;
}

/**
 * Parse command-line arguments for --email, --password, --name flags.
 *
 * @example
 * // npm run seed:admin -- --email admin@example.com --password Secret123!
 * const args = parseArgs();
 * // args = { email: "admin@example.com", password: "Secret123!" }
 *
 * @returns ParsedArgs object with optional email, password, name
 */
function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const result: ParsedArgs = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--email" && args[i + 1]) {
      result.email = args[++i];
    } else if (args[i] === "--password" && args[i + 1]) {
      result.password = args[++i];
    } else if (args[i] === "--name" && args[i + 1]) {
      result.name = args[++i];
    }
  }

  return result;
}

/**
 * Prompt user for input with optional hidden mode (for passwords).
 *
 * In hidden mode, characters are replaced with asterisks (*) and
 * the input is not echoed to the terminal. Supports backspace.
 *
 * @param question - The prompt text to display
 * @param hidden - If true, hide input with asterisks (for passwords)
 * @returns Promise resolving to the user's input string
 *
 * @example
 * const email = await prompt("Email: ");
 * const password = await prompt("Password: ", true);
 */
function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (hidden && process.stdin.isTTY) {
      process.stdout.write(question);
      let input = "";

      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");

      const onData = (char: string) => {
        if (char === "\n" || char === "\r" || char === "\u0004") {
          process.stdin.setRawMode(false);
          process.stdin.removeListener("data", onData);
          process.stdout.write("\n");
          rl.close();
          resolve(input);
        } else if (char === "\u0003") {
          process.exit();
        } else if (char === "\u007F" || char === "\b") {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else {
          input += char;
          process.stdout.write("*");
        }
      };

      process.stdin.on("data", onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

/**
 * Validate email format using a standard regex pattern.
 *
 * @param email - Email address to validate
 * @returns true if email format is valid, false otherwise
 *
 * @example
 * validateEmail("user@example.com"); // true
 * validateEmail("invalid-email");    // false
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength requirements.
 *
 * Current requirements:
 * - Minimum 8 characters
 *
 * @param password - Password to validate
 * @returns Object with `valid` boolean and optional `message` on failure
 *
 * @example
 * validatePassword("short");     // { valid: false, message: "Password must be..." }
 * validatePassword("LongEnough123"); // { valid: true }
 */
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  return { valid: true };
}

/**
 * Main entry point for the seed-admin CLI script.
 *
 * Flow:
 * 1. Parse command-line arguments (--email, --password, --name)
 * 2. Prompt for any missing values interactively
 * 3. Validate email format and password strength
 * 4. Connect to MongoDB using MONGODB_URI from environment
 * 5. Check if SYSTEM_ADMIN with this email already exists
 * 6. Hash password with bcrypt (cost 12)
 * 7. Insert new SYSTEM_ADMIN document
 * 8. Print success message with login instructions
 *
 * @throws Exits with code 1 on validation failure or database error
 */
async function main() {
  console.log("\n🔐 SYSTEM_ADMIN Seed Script\n");
  console.log("═".repeat(50));

  const args = parseArgs();

  let email = args.email;
  let password = args.password;
  let name = args.name;

  if (!email) {
    email = await prompt("Admin email: ");
  }

  if (!validateEmail(email)) {
    console.error("❌ Invalid email format");
    process.exit(1);
  }

  if (!password) {
    password = await prompt("Admin password: ", true);
    const confirm = await prompt("Confirm password: ", true);
    if (password !== confirm) {
      console.error("❌ Passwords do not match");
      process.exit(1);
    }
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    console.error(`❌ ${passwordValidation.message}`);
    process.exit(1);
  }

  if (!name) {
    name = await prompt("Admin name (default: System Admin): ");
    if (!name.trim()) {
      name = "System Admin";
    }
  }

  console.log("\n📡 Connecting to MongoDB...");

  try {
    await mongoose.connect(MONGODB_URI!);
    console.log("✓ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    const bcryptModule = await import("bcryptjs");
    const bcrypt = bcryptModule.default ?? bcryptModule;

    const existingAdmin = await db.collection("users").findOne({
      email: email.toLowerCase(),
      organizationId: null,
      role: "SYSTEM_ADMIN",
    });

    if (existingAdmin) {
      console.log(`\n⚠️  SYSTEM_ADMIN with email "${email}" already exists.`);
      console.log("   No changes made.");
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log("\n🔑 Hashing password...");
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log("📝 Creating SYSTEM_ADMIN user...");
    const now = new Date();
    const result = await db.collection("users").insertOne({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      role: "SYSTEM_ADMIN",
      organizationId: null,
      mustChangePassword: false,
      createdBy: null,
      createdAt: now,
      updatedAt: now,
    });

    console.log("\n" + "═".repeat(50));
    console.log("✅ SYSTEM_ADMIN created successfully!");
    console.log("═".repeat(50));
    console.log(`\n   ID:    ${result.insertedId}`);
    console.log(`   Email: ${email.toLowerCase()}`);
    console.log(`   Name:  ${name.trim()}`);
    console.log(`\n📌 Login at: /admin/login`);
    console.log("   (or /login with organization field empty)\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Error:", err instanceof Error ? err.message : err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
