import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const webinarSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    speaker: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // ISO date string (yyyy-mm-dd)
    time: { type: String, required: true },
    description: { type: String, default: "" },
    live: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export type WebinarDoc = InferSchemaType<typeof webinarSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Webinar = models.Webinar || model("Webinar", webinarSchema);
