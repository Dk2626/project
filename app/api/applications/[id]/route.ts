import { connectDB } from "@/lib/db";
import { Application, ALL_STATUSES } from "@/models/Application";
import { ok, fail, handle, serialize, requireUser, requireAdmin } from "@/lib/api";
import { isValidObjectId } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

// Admin: update the status of an application.
export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    requireAdmin();
    if (!isValidObjectId(params.id)) return fail("Application not found.", 404);
    const { status, note } = await req.json();

    if (status && !ALL_STATUSES.includes(status))
      return fail("That status is not valid.");

    await connectDB();
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

    if (session.role !== "admin" && app.user.toString() !== session.id)
      return fail("You can only withdraw your own applications.", 403);

    await app.deleteOne();
    return ok({ deleted: true });
  });
}
