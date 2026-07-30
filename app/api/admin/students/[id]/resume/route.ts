import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ok, fail, handle, serialize, requireAdmin } from "@/lib/api";
import { readResumeFile, replaceResume, removeResume } from "@/lib/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/**
 * POST — an admin uploads / replaces a student's CV on their behalf.
 * The old object is removed from the bucket, same as the student flow.
 */
export async function POST(req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    if (!isValidObjectId(params.id)) return fail("Student not found.", 404);

    await connectDB();
    const student: any = await User.findOne({
      _id: params.id,
      role: "student",
    })
      .select("_id")
      .lean();
    if (!student) return fail("Student not found.", 404);

    const file = await readResumeFile(req);
    if (!file) return fail("Choose a PDF to upload.");

    const result = await replaceResume(params.id, file);

    const updated = await User.findById(params.id).select("-password").lean();
    return ok({ ...serialize(updated), oldResumeRemoved: result.oldRemoved });
  });
}

/** DELETE — remove a student's CV from both the record and the bucket. */
export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    if (!isValidObjectId(params.id)) return fail("Student not found.", 404);

    await removeResume(params.id);

    await connectDB();
    const updated = await User.findById(params.id).select("-password").lean();
    return ok(serialize(updated));
  });
}
