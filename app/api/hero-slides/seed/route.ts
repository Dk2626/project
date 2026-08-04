import { connectDB } from "@/lib/db";
import { HeroSlide } from "@/models/HeroSlide";
import { ok, fail, handle, serialize, requireSuperAdmin } from "@/lib/api";
import { DEFAULT_HERO_SLIDES } from "@/lib/heroDefaults";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST — copy the built-in default slides into the database so they can be
 * edited from the dashboard. Refuses to run if slides already exist, so a
 * stray second click can't duplicate the set.
 *
 * The copies keep pointing at the images in `/public`; replacing one through
 * the edit form uploads to S3 as normal.
 */
export async function POST() {
  return handle(async () => {
    await requireSuperAdmin();
    await connectDB();

    const existing = await HeroSlide.countDocuments();
    if (existing > 0) {
      return fail(
        "There are already slides in the database. Delete them first if you want to start from the defaults."
      );
    }

    const created = await HeroSlide.insertMany(
      DEFAULT_HERO_SLIDES.map((slide, index) => ({
        title: slide.title,
        description: slide.description ?? "",
        desktopImageUrl: slide.desktopImageUrl,
        desktopImageKey: "",
        mobileImageUrl: slide.mobileImageUrl ?? "",
        mobileImageKey: "",
        textTone: slide.textTone ?? "light",
        order: index,
        active: true,
      }))
    );

    return ok(created.map((doc: any) => serialize(doc)), 201);
  });
}
