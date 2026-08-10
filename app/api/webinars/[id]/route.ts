import { connectDB } from "@/lib/db";
import { Webinar } from "@/models/Webinar";
import { Application } from "@/models/Application";
import { ok, fail, handle, serialize, requireAdmin } from "@/lib/api";
import { withWebinarImage } from "@/lib/webinarMedia";
import {
  uploadWebinarImage,
  deleteWebinarImage,
  readWebinarImageFile,
} from "@/lib/webinarUploads";
import { isValidObjectId } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  return handle(async () => {
    if (!isValidObjectId(params.id)) return fail("Webinar not found.", 404);
    await connectDB();
    const webinar = await Webinar.findById(params.id).lean();
    if (!webinar) return fail("Webinar not found.", 404);
    return ok(withWebinarImage(serialize(webinar)));
  });
}

/**
 * PUT — update a webinar. Admin only.
 *
 * JSON for field-only edits (e.g. toggling `active`), or multipart/form-data
 * when the cover image is being added or replaced. `removeImage=true` drops
 * the current image and goes back to the placeholder. The old S3 object is
 * deleted only after the new URL is committed.
 */
export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    if (!isValidObjectId(params.id)) return fail("Webinar not found.", 404);

    await connectDB();
    const existing: any = await Webinar.findById(params.id).lean();
    if (!existing) return fail("Webinar not found.", 404);

    const contentType = req.headers.get("content-type") ?? "";
    const update: Record<string, any> = {};
    /** Old object to clean up once the new URL is committed. */
    let orphan: { key?: string; url?: string } | null = null;

    if (contentType.includes("multipart/form-data")) {
      const fd = await req.formData();
      const text = (name: string) => String(fd.get(name) ?? "").trim();
      const has = (name: string) => fd.has(name);

      if (has("title")) {
        if (!text("title")) return fail("Webinar title is required.");
        update.title = text("title");
      }
      if (has("speaker")) {
        if (!text("speaker")) return fail("Speaker is required.");
        update.speaker = text("speaker");
      }
      if (has("date")) {
        if (!text("date")) return fail("Date is required.");
        update.date = text("date");
      }
      if (has("time")) {
        if (!text("time")) return fail("Time is required.");
        update.time = text("time");
      }
      if (has("description")) update.description = text("description");
      if (has("live")) update.live = fd.get("live") === "true";
      if (has("active")) update.active = fd.get("active") !== "false";

      const image = readWebinarImageFile(fd);
      if (image) {
        const uploaded = await uploadWebinarImage(image);
        update.imageUrl = uploaded.url;
        update.imageKey = uploaded.key;
        orphan = { key: existing.imageKey, url: existing.imageUrl };
      } else if (fd.get("removeImage") === "true") {
        update.imageUrl = "";
        update.imageKey = "";
        orphan = { key: existing.imageKey, url: existing.imageUrl };
      }
    } else {
      const body = await req.json();
      const allowed = [
        "title",
        "speaker",
        "date",
        "time",
        "description",
        "live",
        "active",
      ];
      for (const field of allowed) {
        if (body[field] !== undefined) update[field] = body[field];
      }
    }

    const webinar = await Webinar.findByIdAndUpdate(params.id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!webinar) return fail("Webinar not found.", 404);

    if (orphan) await deleteWebinarImage(orphan.key, orphan.url);

    return ok(withWebinarImage(serialize(webinar)));
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    if (!isValidObjectId(params.id)) return fail("Webinar not found.", 404);
    await connectDB();
    const webinar: any = await Webinar.findByIdAndDelete(params.id);
    if (!webinar) return fail("Webinar not found.", 404);
    await Application.deleteMany({ webinar: params.id });
    await deleteWebinarImage(webinar.imageKey, webinar.imageUrl);
    return ok({ deleted: true });
  });
}
