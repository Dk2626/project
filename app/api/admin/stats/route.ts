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
    requireAdmin();
    await connectDB();

    const [students, jobs, webinars, jobApps, webinarApps] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Job.countDocuments(),
      Webinar.countDocuments(),
      Application.countDocuments({ kind: "job" }),
      Application.countDocuments({ kind: "webinar" }),
    ]);

    return ok({
      students,
      jobs,
      webinars,
      jobApplications: jobApps,
      webinarApplications: webinarApps,
      totalApplications: jobApps + webinarApps,
    });
  });
}
