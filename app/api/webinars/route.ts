import { connectDB } from "@/lib/db";
import { Webinar } from "@/models/Webinar";
import { ok, fail, handle, serialize, requireAdmin } from "@/lib/api";
import { withWebinarImage } from "@/lib/webinarMedia";
import { uploadWebinarImage, readWebinarImageFile } from "@/lib/webinarUploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const includeAll = url.searchParams.get("all") === "1";
    await connectDB();
    const filter = includeAll ? {} : { active: true };
    const webinars = await Webinar.find(filter).sort({ date: 1 }).lean();
    // `displayImageUrl` is always set — the placeholder when nothing was
    // uploaded — so callers never have to handle an empty image themselves.
    return ok(webinars.map((w) => withWebinarImage(serialize(w))));
  });
}

/**
 * POST — create a webinar. Admin only.
 *
 * Accepts multipart/form-data (when a cover image is attached, field name
 * `image`) or plain JSON (no image). The image is optional in both cases.
 */
export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();

    const contentType = req.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");

    let fields: Record<string, any>;
    let image: File | null = null;

    if (isMultipart) {
      const fd = await req.formData();
      const text = (name: string) => String(fd.get(name) ?? "").trim();
      fields = {
        title: text("title"),
        speaker: text("speaker"),
        date: text("date"),
        time: text("time"),
        description: text("description"),
        live: fd.get("live") === "true",
        active: fd.get("active") !== "false",
      };
      image = readWebinarImageFile(fd);
    } else {
      const body = await req.json();
      fields = {
        title: String(body.title ?? "").trim(),
        speaker: String(body.speaker ?? "").trim(),
        date: body.date,
        time: body.time,
        description: body.description || "",
        live: Boolean(body.live),
        active: body.active !== false,
      };
    }

    if (!fields.title) return fail("Webinar title is required.");
    if (!fields.speaker) return fail("Speaker is required.");
    if (!fields.date) return fail("Date is required.");
    if (!fields.time) return fail("Time is required.");

    // Upload before touching the database — a failed upload leaves no row.
    const uploaded = image ? await uploadWebinarImage(image) : null;

    await connectDB();
    const webinar = await Webinar.create({
      ...fields,
      imageUrl: uploaded?.url ?? "",
      imageKey: uploaded?.key ?? "",
    });

    return ok(withWebinarImage(serialize(webinar)), 201);
  });
}
