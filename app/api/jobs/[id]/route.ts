import { connectDB } from "@/lib/db";
import { Job } from "@/models/Job";
import { Application } from "@/models/Application";
import {
  ok,
  fail,
  handle,
  serialize,
  requireJobPoster,
  HttpError,
} from "@/lib/api";
import { isValidObjectId } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** Admin can touch any job; a recruiter only the ones they posted. */
async function requireOwnJob(id: string) {
  const session = await requireJobPoster();
  await connectDB();
  const job: any = await Job.findById(id);
  if (!job) throw new HttpError(404, "Job not found.");
  if (
    session.role !== "admin" &&
    String(job.postedBy ?? "") !== session.id
  )
    throw new HttpError(403, "You can only manage your own job postings.");
  return { session, job };
}

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
    if (!isValidObjectId(params.id)) return fail("Job not found.", 404);
    const { session } = await requireOwnJob(params.id);
    const body = await req.json();

    if (Array.isArray(body.skills) === false && typeof body.skills === "string") {
      body.skills = body.skills.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    // Ownership fields are never client-editable.
    delete body.postedBy;
    delete body.postedByRole;
    delete body._id;
    if (session.role === "recruiter") delete body.company;

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
    if (!isValidObjectId(params.id)) return fail("Job not found.", 404);
    const { job } = await requireOwnJob(params.id);
    await job.deleteOne();
    // Clean up applications tied to this job.
    await Application.deleteMany({ job: params.id });
    return ok({ deleted: true });
  });
}
