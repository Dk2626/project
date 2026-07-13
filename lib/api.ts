import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "./auth";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json({ ok: true, data }, { status: init ?? 200 });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/** Convert a Mongoose doc/lean object to a plain JSON-safe object with string ids. */
export function serialize<T extends Record<string, any>>(doc: T): any {
  if (doc == null) return doc;
  const obj: any = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === "object" && typeof val.toHexString === "function") {
      obj[key] = val.toString();
    } else if (val instanceof Date) {
      obj[key] = val.toISOString();
    } else if (Array.isArray(val)) {
      obj[key] = val.map((v) =>
        v && typeof v === "object" && !(v instanceof Date) ? serialize(v) : v
      );
    } else if (
      val &&
      typeof val === "object" &&
      !(val instanceof Date) &&
      val.constructor?.name === "Object"
    ) {
      obj[key] = serialize(val);
    }
  }
  return obj;
}

/** Throwable guard used by route handlers. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function requireUser(): SessionUser {
  const user = getSessionUser();
  if (!user) throw new HttpError(401, "You must be logged in to do that.");
  return user;
}

export function requireAdmin(): SessionUser {
  const user = requireUser();
  if (user.role !== "admin")
    throw new HttpError(403, "Admin access is required for this action.");
  return user;
}

/** Wrap a handler so thrown HttpErrors become clean JSON responses. */
export function handle(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  return fn().catch((err) => {
    if (err instanceof HttpError) return fail(err.message, err.status);
    console.error("[API error]", err);
    const msg =
      err instanceof Error ? err.message : "Something went wrong. Please try again.";
    return fail(msg, 500);
  });
}
