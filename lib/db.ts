import mongoose from "mongoose";

/**
 * Cached Mongoose connection.
 *
 * In development Next.js clears the module cache on every request which would
 * otherwise open a brand new DB connection each time (and exhaust the pool).
 * We stash the connection on the Node global so it survives hot reloads, and
 * in production/serverless it's reused across warm invocations.
 */

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongoose ?? { conn: null, promise: null };
global._mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your .env.local file (see .env.example)."
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10_000,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset so the next request can retry instead of reusing a rejected promise.
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
