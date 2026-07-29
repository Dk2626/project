import { connectDB } from "@/lib/db";
import { Job } from "@/models/Job";
import { Application } from "@/models/Application";
import { User } from "@/models/User";
import { ok, fail, handle, requireUser } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Counters for the recruiter's own dashboard. */
export async function GET() {
  return handle(async () => {
    const session = requireUser();
    if (session.role !== "recruiter")
      return fail("Recruiter access is required for this action.", 403);

    await connectDB();

    const me: any = await User.findById(session.id)
      .select("approvalStatus companyName rejectionReason")
      .lean();

    const jobs: any[] = await Job.find({ postedBy: session.id })
      .select("_id active")
      .lean();
    const jobIds = jobs.map((j) => j._id);

    const [applicants, shortlisted, hired] = await Promise.all([
      Application.countDocuments({ kind: "job", job: { $in: jobIds } }),
      Application.countDocuments({
        kind: "job",
        job: { $in: jobIds },
        status: { $in: ["Shortlisted", "Interview"] },
      }),
      Application.countDocuments({
        kind: "job",
        job: { $in: jobIds },
        status: "Accepted",
      }),
    ]);

    return ok({
      approvalStatus: me?.approvalStatus ?? "pending",
      companyName: me?.companyName ?? "",
      rejectionReason: me?.rejectionReason ?? "",
      jobs: jobs.length,
      activeJobs: jobs.filter((j) => j.active !== false).length,
      applicants,
      shortlisted,
      hired,
    });
  });
}
