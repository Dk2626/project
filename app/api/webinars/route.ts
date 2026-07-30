import { connectDB } from "@/lib/db";
import { Webinar } from "@/models/Webinar";
import { ok, fail, handle, serialize, requireAdmin } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const includeAll = url.searchParams.get("all") === "1";
    await connectDB();
    const filter = includeAll ? {} : { active: true };
    const webinars = await Webinar.find(filter).sort({ date: 1 }).lean();
    return ok(webinars.map(serialize));
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const body = await req.json();
    if (!body.title?.trim()) return fail("Webinar title is required.");
    if (!body.speaker?.trim()) return fail("Speaker is required.");
    if (!body.date) return fail("Date is required.");
    if (!body.time) return fail("Time is required.");

    await connectDB();
    const webinar = await Webinar.create({
      title: body.title.trim(),
      speaker: body.speaker.trim(),
      date: body.date,
      time: body.time,
      description: body.description || "",
      live: Boolean(body.live),
      active: body.active !== false,
    });
    return ok(serialize(webinar), 201);
  });
}
