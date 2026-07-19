import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ok, fail, handle, serialize, requireUser } from "@/lib/api";
import { signToken, authCookieOptions, AUTH_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fields the signed-in user is allowed to change about themselves.
 * Deliberately excludes the unique / system fields:
 *   - email    (unique account identifier — must not change)
 *   - password (changed via a dedicated flow, not here)
 *   - role     (a student can never promote themselves)
 *   - resumeUrl / resumeKey (managed by the upload flow)
 *   - _id, createdAt, updatedAt (system managed)
 */
const EDITABLE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "dob",
  "gender",
  "studentType",
  // College
  "college",
  "degree",
  "department",
  "currentYear",
  // School
  "schoolName",
  "classGrade",
  "board",
  "schoolStream",
  // Shared
  "graduationYear",
  "cgpa",
  "linkedin",
  "github",
] as const;

// GET: the signed-in user's own full profile (no password).
export async function GET() {
  return handle(async () => {
    const session = requireUser();
    await connectDB();
    const me = await User.findById(session.id).select("-password").lean();
    if (!me) return fail("Your account could not be found.", 404);
    return ok(serialize(me));
  });
}

// PUT: update the signed-in user's own editable fields.
export async function PUT(req: Request) {
  return handle(async () => {
    const session = requireUser();

    const body = await req.json();

    // Only copy across the whitelisted fields. Anything else the client
    // sends (email, role, password, _id, …) is silently ignored — a user
    // cannot change their identifier or elevate their own role here.
    const update: Record<string, any> = {};
    for (const key of EDITABLE_FIELDS) {
      if (key in body) {
        const val = body[key];
        update[key] = typeof val === "string" ? val.trim() : val;
      }
    }

    if ("firstName" in update && update.firstName === "")
      return fail("First name cannot be empty.");
    if ("lastName" in update && update.lastName === "")
      return fail("Last name cannot be empty.");

    await connectDB();

    const me = await User.findByIdAndUpdate(
      session.id,
      { $set: update },
      { new: true, runValidators: true }
    )
      .select("-password")
      .lean();

    if (!me) return fail("Your account could not be found.", 404);

    // If the display name changed, re-issue the session cookie so the
    // navbar greeting and any other session-derived UI stay in sync.
    const newName = `${me.firstName} ${me.lastName}`;
    if (newName !== session.name) {
      cookies().set(
        AUTH_COOKIE,
        signToken({
          id: session.id,
          email: session.email,
          name: newName,
          role: session.role,
        }),
        authCookieOptions()
      );
    }

    return ok(serialize(me));
  });
}
