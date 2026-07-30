import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Job } from "@/models/Job";
import { Webinar } from "@/models/Webinar";
import { Application } from "@/models/Application";
import { ok, handle, requireAdmin } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    await requireAdmin();
    await connectDB();

    const [
      students,
      jobs,
      webinars,
      jobApps,
      webinarApps,
      recruiters,
      pendingRecruiters,
      recruiterJobs,
      admins,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Job.countDocuments(),
      Webinar.countDocuments(),
      Application.countDocuments({ kind: "job" }),
      Application.countDocuments({ kind: "webinar" }),
      User.countDocuments({ role: "recruiter" }),
      User.countDocuments({ role: "recruiter", approvalStatus: "pending" }),
      Job.countDocuments({ postedByRole: "recruiter" }),
      User.countDocuments({ role: { $in: ["admin", "superadmin"] } }),
    ]);

    return ok({
      students,
      jobs,
      webinars,
      recruiters,
      pendingRecruiters,
      recruiterJobs,
      admins,
      jobApplications: jobApps,
      webinarApplications: webinarApps,
      totalApplications: jobApps + webinarApps,
    });
  });
}
