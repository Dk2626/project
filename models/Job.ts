import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const jobSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["Full Time", "Part Time", "Internship", "Contract", "Remote"],
      default: "Full Time",
    },
    experience: { type: String, default: "" },
    salary: { type: String, default: "" },
    description: { type: String, default: "" },
    skills: { type: [String], default: [] },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export type JobDoc = InferSchemaType<typeof jobSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Job = models.Job || model("Job", jobSchema);
