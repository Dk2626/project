import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Job } from "@/models/Job";
import { Application } from "@/models/Application";
import { ok, handle, serialize, requireAdmin } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: every registered recruiter, with job / applicant counts. */
export async function GET() {
  return handle(async () => {
    requireAdmin();
    await connectDB();

    const recruiters: any[] = await User.find({ role: "recruiter" })
      .sort({ createdAt: -1 })
      .select("-password")
      .lean();

    const jobs: any[] = await Job.find({
      postedBy: { $in: recruiters.map((r) => r._id) },
    })
      .select("_id postedBy active")
      .lean();

    const apps: any[] = await Application.find({
      kind: "job",
      job: { $in: jobs.map((j) => j._id) },
    })
      .select("job")
      .lean();

    const jobOwner = new Map(jobs.map((j) => [String(j._id), String(j.postedBy)]));
    const applicantCount = new Map<string, number>();
    for (const a of apps) {
      const owner = jobOwner.get(String(a.job));
      if (!owner) continue;
      applicantCount.set(owner, (applicantCount.get(owner) ?? 0) + 1);
    }

    return ok(
      recruiters.map((r) => {
        const id = String(r._id);
        const mine = jobs.filter((j) => String(j.postedBy) === id);
        return {
          ...serialize(r),
          jobCount: mine.length,
          activeJobCount: mine.filter((j) => j.active !== false).length,
          applicantCount: applicantCount.get(id) ?? 0,
        };
      })
    );
  });
}
