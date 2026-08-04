import { connectDB } from "@/lib/db";
import { HeroSlide } from "@/models/HeroSlide";
import { ok, fail, handle, serialize, requireSuperAdmin } from "@/lib/api";
import { uploadHeroImage, deleteHeroImage, readHeroImageFiles } from "@/lib/heroImages";
import { isValidObjectId } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  return handle(async () => {
    if (!isValidObjectId(params.id)) return fail("Slide not found.", 404);
    await connectDB();
    const slide = await HeroSlide.findById(params.id).lean();
    if (!slide) return fail("Slide not found.", 404);
    return ok(serialize(slide));
  });
}

/**
 * PUT — update a slide. Superadmin only.
 *
 * Accepts either JSON (for quick field-only changes like toggling `active`
 * or setting `order`) or multipart/form-data when an image is being
 * replaced. A replaced image's old object is deleted from S3 *after* the new
 * URL is saved, so a failure mid-way never leaves a slide with no picture.
 */
export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireSuperAdmin();
    if (!isValidObjectId(params.id)) return fail("Slide not found.", 404);

    await connectDB();
    const existing: any = await HeroSlide.findById(params.id).lean();
    if (!existing) return fail("Slide not found.", 404);

    const contentType = req.headers.get("content-type") ?? "";
    const update: Record<string, any> = {};
    /** Old objects to clean up once the new URLs are committed. */
    const orphans: Array<{ key?: string; url?: string }> = [];

    if (contentType.includes("multipart/form-data")) {
      const fd = await req.formData();
      const text = (name: string) => String(fd.get(name) ?? "").trim();
      const has = (name: string) => fd.has(name);

      if (has("title")) {
        if (!text("title")) return fail("Slide title is required.");
        update.title = text("title");
      }
      for (const field of [
        "description",
        "ctaLabel",
        "ctaHref",
        "secondaryCtaLabel",
        "secondaryCtaHref",
      ]) {
        if (has(field)) update[field] = text(field);
      }
      if (has("textTone")) {
        update.textTone = text("textTone") === "dark" ? "dark" : "light";
      }
      if (has("order")) {
        const n = Number(text("order"));
        if (Number.isFinite(n)) update.order = n;
      }
      if (has("active")) update.active = fd.get("active") !== "false";

      const { desktop, mobile } = readHeroImageFiles(fd);
      if (desktop) {
        const uploaded = await uploadHeroImage(desktop);
        update.desktopImageUrl = uploaded.url;
        update.desktopImageKey = uploaded.key;
        orphans.push({
          key: existing.desktopImageKey,
          url: existing.desktopImageUrl,
        });
      }
      if (mobile) {
        const uploaded = await uploadHeroImage(mobile);
        update.mobileImageUrl = uploaded.url;
        update.mobileImageKey = uploaded.key;
        orphans.push({
          key: existing.mobileImageKey,
          url: existing.mobileImageUrl,
        });
      }
      // Explicit "use the desktop image on phones too".
      if (fd.get("removeMobileImage") === "true" && !mobile) {
        update.mobileImageUrl = "";
        update.mobileImageKey = "";
        orphans.push({
          key: existing.mobileImageKey,
          url: existing.mobileImageUrl,
        });
      }
    } else {
      const body = await req.json();
      const allowed = [
        "title",
        "description",
        "ctaLabel",
        "ctaHref",
        "secondaryCtaLabel",
        "secondaryCtaHref",
        "textTone",
        "order",
        "active",
      ];
      for (const field of allowed) {
        if (body[field] !== undefined) update[field] = body[field];
      }
      if (update.title !== undefined && !String(update.title).trim()) {
        return fail("Slide title is required.");
      }
    }

    const slide = await HeroSlide.findByIdAndUpdate(params.id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!slide) return fail("Slide not found.", 404);

    for (const orphan of orphans) {
      await deleteHeroImage(orphan.key, orphan.url);
    }

    return ok(serialize(slide));
  });
}

/** DELETE — remove a slide and both of its images from the bucket. */
export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireSuperAdmin();
    if (!isValidObjectId(params.id)) return fail("Slide not found.", 404);

    await connectDB();
    const slide: any = await HeroSlide.findByIdAndDelete(params.id);
    if (!slide) return fail("Slide not found.", 404);

    await deleteHeroImage(slide.desktopImageKey, slide.desktopImageUrl);
    await deleteHeroImage(slide.mobileImageKey, slide.mobileImageUrl);

    return ok({ deleted: true });
  });
}
