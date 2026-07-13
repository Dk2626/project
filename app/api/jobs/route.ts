import { connectDB } from "@/lib/db";
import { Job } from "@/models/Job";
import { ok, fail, handle, serialize, requireAdmin } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public: list active jobs (admins can pass ?all=1 to include inactive).
export async function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const includeAll = url.searchParams.get("all") === "1";
    await connectDB();
    const filter = includeAll ? {} : { active: true };
    const jobs = await Job.find(filter).sort({ createdAt: -1 }).lean();
    return ok(jobs.map(serialize));
  });
}

// Admin: create a job.
export async function POST(req: Request) {
  return handle(async () => {
    requireAdmin();
    const body = await req.json();
    if (!body.title?.trim()) return fail("Job title is required.");
    if (!body.company?.trim()) return fail("Company is required.");
    if (!body.location?.trim()) return fail("Location is required.");

    await connectDB();
    const job = await Job.create({
      title: body.title.trim(),
      company: body.company.trim(),
      location: body.location.trim(),
      type: body.type || "Full Time",
      experience: body.experience || "",
      salary: body.salary || "",
      description: body.description || "",
      skills: Array.isArray(body.skills)
        ? body.skills
        : String(body.skills || "")
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean),
      active: body.active !== false,
    });
    return ok(serialize(job), 201);
  });
}
