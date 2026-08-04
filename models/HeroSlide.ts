import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * A slide in the homepage hero slider.
 *
 * Two images are stored per slide: `desktop` (wide banner, shown from the
 * `md` breakpoint up) and `mobile` (taller crop, shown below it). The mobile
 * one is optional — the component falls back to the desktop image when it is
 * missing, so an admin can add a slide with a single upload.
 *
 * Both the public URL and the S3 object key are kept. The key is what we use
 * to delete the old object when an image is replaced; the URL is what the
 * browser loads.
 */
const heroSlideSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    desktopImageUrl: { type: String, required: true },
    desktopImageKey: { type: String, default: "" },
    mobileImageUrl: { type: String, default: "" },
    mobileImageKey: { type: String, default: "" },

    /**
     * Which way to colour the overlaid copy. "light" = white text over a dark
     * scrim (for dark photos), "dark" = navy text over a light scrim.
     */
    textTone: { type: String, enum: ["light", "dark"], default: "light" },

    /** Display position, ascending. Ties break on createdAt. */
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// The public site reads active slides in display order on every homepage hit.
heroSlideSchema.index({ active: 1, order: 1, createdAt: 1 });

export type HeroSlideDoc = InferSchemaType<typeof heroSlideSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const HeroSlide = models.HeroSlide || model("HeroSlide", heroSlideSchema);
