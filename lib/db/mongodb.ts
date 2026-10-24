/**
 * MongoDB connection utility for Next.js App Router.
 *
 * Caches the Mongoose connection on `globalThis` so hot reload in development
 * does not open a new connection on every module re-evaluation.
 *
 * Requires `MONGODB_URI` in `.env.local`. Use only from server-side code
 * (API routes, Server Actions, Server Components) — never from the browser.
 *
 * On first connection, auto-seeds SYSTEM_ADMIN from env vars if configured.
 *
 * @see lib/db/seed-admin.ts - Auto-seeding logic
 */

import mongoose from "mongoose";
import { seedAdminFromEnv } from "./seed-admin";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI. Add it to .env.local (see .env.example).",
  );
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

/**
 * Connect to MongoDB Atlas (or reuse an existing cached connection).
 *
 * On first connection, auto-seeds SYSTEM_ADMIN from environment variables
 * if SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are configured.
 *
 * @returns The shared Mongoose instance after a successful connection
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!).then(async (conn) => {
      await seedAdminFromEnv();
      return conn;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
