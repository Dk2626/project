import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Job } from "@/models/Job";
import { Application } from "@/models/Application";
import {
  ok,
  handle,
  serialize,
  requireAdmin,
  pageParams,
  paginated,
  searchFilter,
} from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Attach job / applicant counts to a page of recruiters. */
async function withCounts(recruiters: any[]) {
  if (recruiters.length === 0) return [];

  const ids = recruiters.map((r) => r._id);

  const jobs: any[] = await Job.find({ postedBy: { $in: ids } })
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

  return recruiters.map((r) => {
    const id = String(r._id);
    const mine = jobs.filter((j) => String(j.postedBy) === id);
    return {
      ...serialize(r),
      jobCount: mine.length,
      activeJobCount: mine.filter((j) => j.active !== false).length,
      applicantCount: applicantCount.get(id) ?? 0,
    };
  });
}

/**
 * Admin: registered recruiters with their job / applicant counts.
 *
 * ?page= & ?limit= paginate, ?q= searches, ?status= filters by approval
 * state. The count queries only ever touch the recruiters on the current
 * page, so this stays fast as the list grows.
 */
export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin();
    await connectDB();

    const { page, limit, skip, paged, q } = pageParams(req);
    const status = new URL(req.url).searchParams.get("status");

    const filter: Record<string, any> = { role: "recruiter" };

    if (status === "pending") {
      // Legacy rows may have no approvalStatus at all — treat those as pending.
      filter.$and = [
        {
          $or: [
            { approvalStatus: "pending" },
            { approvalStatus: { $exists: false } },
          ],
        },
      ];
    } else if (status === "approved" || status === "rejected") {
      filter.approvalStatus = status;
    }

    const search = searchFilter(q, [
      "firstName",
      "lastName",
      "email",
      "phone",
      "companyName",
    ]);
    if (search) Object.assign(filter, search);

    if (!paged) {
      const recruiters: any[] = await User.find(filter)
        .sort({ createdAt: -1 })
        .select("-password")
        .lean();
      return ok(await withCounts(recruiters));
    }

    const countBase: Record<string, any> = { role: "recruiter" };
    if (search) Object.assign(countBase, search);

    const [recruiters, total, all, approved, rejected] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password")
        .lean(),
      User.countDocuments(filter),
      User.countDocuments(countBase),
      User.countDocuments({ ...countBase, approvalStatus: "approved" }),
      User.countDocuments({ ...countBase, approvalStatus: "rejected" }),
    ]);

    return ok({
      ...paginated(await withCounts(recruiters), total, { page, limit }),
      counts: {
        all,
        approved,
        rejected,
        pending: all - approved - rejected,
      },
    });
  });
}
