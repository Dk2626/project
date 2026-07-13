import { connectDB } from "@/lib/db";
import { Job } from "@/models/Job";
import { Application } from "@/models/Application";
import { ok, fail, handle, serialize, requireAdmin } from "@/lib/api";
import { isValidObjectId } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  return handle(async () => {
    if (!isValidObjectId(params.id)) return fail("Job not found.", 404);
    await connectDB();
    const job = await Job.findById(params.id).lean();
    if (!job) return fail("Job not found.", 404);
    return ok(serialize(job));
  });
}

export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    requireAdmin();
    if (!isValidObjectId(params.id)) return fail("Job not found.", 404);
    const body = await req.json();
    if (Array.isArray(body.skills) === false && typeof body.skills === "string") {
      body.skills = body.skills.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    await connectDB();
    const job = await Job.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!job) return fail("Job not found.", 404);
    return ok(serialize(job));
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    requireAdmin();
    if (!isValidObjectId(params.id)) return fail("Job not found.", 404);
    await connectDB();
    const job = await Job.findByIdAndDelete(params.id);
    if (!job) return fail("Job not found.", 404);
    // Clean up applications tied to this job.
    await Application.deleteMany({ job: params.id });
    return ok({ deleted: true });
  });
}
