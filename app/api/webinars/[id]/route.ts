import { connectDB } from "@/lib/db";
import { Webinar } from "@/models/Webinar";
import { Application } from "@/models/Application";
import { ok, fail, handle, serialize, requireAdmin } from "@/lib/api";
import { isValidObjectId } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  return handle(async () => {
    if (!isValidObjectId(params.id)) return fail("Webinar not found.", 404);
    await connectDB();
    const webinar = await Webinar.findById(params.id).lean();
    if (!webinar) return fail("Webinar not found.", 404);
    return ok(serialize(webinar));
  });
}

export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    if (!isValidObjectId(params.id)) return fail("Webinar not found.", 404);
    const body = await req.json();
    await connectDB();
    const webinar = await Webinar.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!webinar) return fail("Webinar not found.", 404);
    return ok(serialize(webinar));
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    if (!isValidObjectId(params.id)) return fail("Webinar not found.", 404);
    await connectDB();
    const webinar = await Webinar.findByIdAndDelete(params.id);
    if (!webinar) return fail("Webinar not found.", 404);
    await Application.deleteMany({ webinar: params.id });
    return ok({ deleted: true });
  });
}
