import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Application } from "@/models/Application";
import { findIdByEmail } from "@/lib/users";
import {
  ok,
  fail,
  handle,
  serialize,
  requireAdmin,
  requireSuperAdmin,
} from "@/lib/api";
import { removeResume } from "@/lib/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/**
 * Fields a superadmin may change on a student record.
 *
 * `email` is included here (unlike the self-service /api/profile route) so a
 * superadmin can correct a typo in someone's login address — it's validated
 * and uniqueness-checked below. Still excluded: password, role, resumeUrl /
 * resumeKey (managed by the upload endpoint) and the system fields.
 */
const EDITABLE_FIELDS = [
  "firstName",
  "lastName",
  "email",
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

/** Any admin may read a single student record. */
export async function GET(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    if (!isValidObjectId(params.id)) return fail("Student not found.", 404);

    await connectDB();
    const student = await User.findOne({ _id: params.id, role: "student" })
      .select("-password")
      .lean();
    if (!student) return fail("Student not found.", 404);

    return ok(serialize(student));
  });
}

/** Superadmin only: edit a student's details. */
export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireSuperAdmin();
    if (!isValidObjectId(params.id)) return fail("Student not found.", 404);

    const body = await req.json();

    const update: Record<string, any> = {};
    for (const key of EDITABLE_FIELDS) {
      if (key in body) {
        const val = body[key];
        update[key] = typeof val === "string" ? val.trim() : val;
      }
    }

    if ("firstName" in update && !update.firstName)
      return fail("First name cannot be empty.");
    if ("lastName" in update && !update.lastName)
      return fail("Last name cannot be empty.");

    await connectDB();

    if ("email" in update) {
      const email = String(update.email).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return fail("Please enter a valid email address.");

      const clash = await findIdByEmail(email);
      if (clash && String(clash._id) !== params.id)
        return fail("Another account already uses that email address.", 409);

      update.email = email;
    }

    const student = await User.findOneAndUpdate(
      { _id: params.id, role: "student" },
      { $set: update },
      { new: true, runValidators: true }
    )
      .select("-password")
      .lean();

    if (!student) return fail("Student not found.", 404);
    return ok(serialize(student));
  });
}

/**
 * Superadmin only: delete a student account, their applications and their
 * CV (removed from the S3 bucket as well).
 */
export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireSuperAdmin();
    if (!isValidObjectId(params.id)) return fail("Student not found.", 404);

    await connectDB();
    const student: any = await User.findOne({
      _id: params.id,
      role: "student",
    })
      .select("_id")
      .lean();
    if (!student) return fail("Student not found.", 404);

    await removeResume(params.id);
    await Application.deleteMany({ user: params.id });
    await User.deleteOne({ _id: params.id });

    return ok({ deleted: true });
  });
}
