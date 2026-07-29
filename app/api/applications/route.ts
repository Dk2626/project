import { connectDB } from "@/lib/db";
import { Application } from "@/models/Application";
import { Job } from "@/models/Job";
import { Webinar } from "@/models/Webinar";
import { User } from "@/models/User";
import { ok, fail, handle, serialize, requireUser } from "@/lib/api";
import { isValidObjectId } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET
 *  - admin      → every application (?recruiter=<id> narrows to one recruiter)
 *  - recruiter  → only applications made to jobs they posted
 *  - student    → only their own
 */
export async function GET(req: Request) {
  return handle(async () => {
    const session = requireUser();
    await connectDB();

    const url = new URL(req.url);
    const kind = url.searchParams.get("kind"); // optional "job" | "webinar"
    const recruiterId = url.searchParams.get("recruiter");

    const filter: Record<string, any> = {};

    if (session.role === "recruiter") {
      // Restrict to this recruiter's own postings.
      const myJobs = await Job.find({ postedBy: session.id }).select("_id").lean();
      filter.kind = "job";
      filter.job = { $in: myJobs.map((j: any) => j._id) };
    } else if (session.role !== "admin") {
      filter.user = session.id;
    } else if (recruiterId) {
      const theirJobs = await Job.find({ postedBy: recruiterId })
        .select("_id")
        .lean();
      filter.kind = "job";
      filter.job = { $in: theirJobs.map((j: any) => j._id) };
    }

    if (kind === "job" || kind === "webinar") filter.kind = kind;

    // Register models referenced by populate (Job/Webinar/User import ensures this).
    void Job;
    void Webinar;
    void User;

    const apps = await Application.find(filter)
      .sort({ createdAt: -1 })
      .populate("job")
      .populate("webinar")
      .populate(
        "user",
        "firstName lastName email phone college degree department currentYear graduationYear cgpa studentType schoolName classGrade linkedin github resumeUrl"
      )
      .lean();

    return ok(apps.map(serialize));
  });
}

// POST: apply to a job or register for a webinar (login required).
export async function POST(req: Request) {
  return handle(async () => {
    const session = requireUser();
    const { jobId, webinarId, note } = await req.json();

    if (!jobId && !webinarId)
      return fail("Nothing to apply to — provide a job or webinar.");
    if (jobId && webinarId)
      return fail("Apply to one thing at a time.");

    await connectDB();

    const applicant = await User.findById(session.id).lean();
    if (!applicant) return fail("Your account could not be found.", 404);

    let kind: "job" | "webinar";
    let target: any;

    if (jobId) {
      if (!isValidObjectId(jobId)) return fail("Job not found.", 404);
      target = await Job.findById(jobId).lean();
      if (!target || target.active === false)
        return fail("This job is no longer accepting applications.", 404);
      kind = "job";
    } else {
      if (!isValidObjectId(webinarId)) return fail("Webinar not found.", 404);
      target = await Webinar.findById(webinarId).lean();
      if (!target || target.active === false)
        return fail("This webinar is no longer open for registration.", 404);
      kind = "webinar";
    }

    // Prevent duplicates up front for a friendly message
    // (the unique index is the ultimate guard).
    const existing = await Application.findOne({
      user: session.id,
      ...(kind === "job" ? { job: jobId } : { webinar: webinarId }),
    }).lean();
    if (existing) {
      return fail(
        kind === "job"
          ? "You've already applied to this job."
          : "You're already registered for this webinar.",
        409
      );
    }

    try {
      const application = await Application.create({
        user: session.id,
        kind,
        job: kind === "job" ? jobId : undefined,
        webinar: kind === "webinar" ? webinarId : undefined,
        status: kind === "job" ? "Applied" : "Registered",
        resumeUrl: (applicant as any).resumeUrl,
        note: note || "",
      });
      return ok(serialize(application), 201);
    } catch (err: any) {
      if (err?.code === 11000)
        return fail("You've already applied to this.", 409);
      throw err;
    }
  });
}
