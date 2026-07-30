import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ok, fail, handle, serialize, requireUser } from "@/lib/api";
import { readResumeFile, replaceResume, removeResume } from "@/lib/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST — the signed-in user replaces their own CV.
 * Body: multipart/form-data with a `resume` PDF.
 * The previously stored file is deleted from the S3 bucket.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const session = requireUser();

    const file = await readResumeFile(req);
    if (!file) return fail("Choose a PDF to upload.");

    const result = await replaceResume(session.id, file);

    await connectDB();
    const me = await User.findById(session.id).select("-password").lean();

    return ok({ ...serialize(me), oldResumeRemoved: result.oldRemoved });
  });
}

/** DELETE — remove the signed-in user's CV (also deletes it from S3). */
export async function DELETE() {
  return handle(async () => {
    const session = requireUser();
    await removeResume(session.id);

    await connectDB();
    const me = await User.findById(session.id).select("-password").lean();
    return ok(serialize(me));
  });
}
