/**
 * MongoDB connection utility for Next.js App Router.
 *
 * Caches the Mongoose connection on `globalThis` so hot reload in development
 * does not open a new connection on every module re-evaluation.
 *
 * Requires `MONGODB_URI` in `.env.local`. Use only from server-side code
 * (API routes, Server Actions, Server Components) — never from the browser.
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI. Add it to .env.local (see atlas-credentials.env).",
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
 * @returns The shared Mongoose instance after a successful connection
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
