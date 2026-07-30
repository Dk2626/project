import { connectDB } from "@/lib/db";
import { Application, ALL_STATUSES } from "@/models/Application";
import { ok, fail, handle, serialize, requireUser, isAdminRole } from "@/lib/api";
import { Job } from "@/models/Job";
import { isValidObjectId } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

// Update the status of an application.
// Admin: any application. Recruiter: only applications to their own jobs.
export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    const session = requireUser();
    if (!isAdminRole(session.role) && session.role !== "recruiter")
      return fail("You are not allowed to change an application status.", 403);
    if (!isValidObjectId(params.id)) return fail("Application not found.", 404);
    const { status, note } = await req.json();

    if (status && !ALL_STATUSES.includes(status))
      return fail("That status is not valid.");

    await connectDB();

    if (session.role === "recruiter") {
      const existing: any = await Application.findById(params.id).lean();
      if (!existing) return fail("Application not found.", 404);
      const job: any = await Job.findById(existing.job).select("postedBy").lean();
      if (!job || String(job.postedBy ?? "") !== session.id)
        return fail("You can only manage applicants for your own jobs.", 403);
    }

    const update: Record<string, any> = {};
    if (status) update.status = status;
    if (typeof note === "string") update.note = note;

    const app = await Application.findByIdAndUpdate(params.id, update, {
      new: true,
    })
      .populate("job")
      .populate("webinar")
      .populate("user", "firstName lastName email")
      .lean();
    if (!app) return fail("Application not found.", 404);
    return ok(serialize(app));
  });
}

// Student: withdraw own application. Admin: delete any.
export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const session = requireUser();
    if (!isValidObjectId(params.id)) return fail("Application not found.", 404);
    await connectDB();

    const app = await Application.findById(params.id);
    if (!app) return fail("Application not found.", 404);

    if (!isAdminRole(session.role) && app.user.toString() !== session.id)
      return fail("You can only withdraw your own applications.", 403);

    await app.deleteOne();
    return ok({ deleted: true });
  });
}
