import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const JOB_STATUSES = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview",
  "Rejected",
  "Accepted",
] as const;

export const WEBINAR_STATUSES = [
  "Registered",
  "Confirmed",
  "Attended",
  "Cancelled",
] as const;

export const ALL_STATUSES = [...JOB_STATUSES, ...WEBINAR_STATUSES];

const applicationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["job", "webinar"], required: true },

    // Only one of these is set depending on `kind`.
    job: { type: Schema.Types.ObjectId, ref: "Job" },
    webinar: { type: Schema.Types.ObjectId, ref: "Webinar" },

    status: {
      type: String,
      enum: ALL_STATUSES,
      default: "Applied",
      index: true,
    },
    resumeUrl: { type: String }, // snapshot of the resume used to apply
    note: { type: String, default: "" }, // optional cover note from the applicant
  },
  { timestamps: true }
);

// A user can only apply once to a given job / webinar.
applicationSchema.index(
  { user: 1, job: 1 },
  { unique: true, partialFilterExpression: { job: { $exists: true } } }
);
applicationSchema.index(
  { user: 1, webinar: 1 },
  { unique: true, partialFilterExpression: { webinar: { $exists: true } } }
);

export type ApplicationDoc = InferSchemaType<typeof applicationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Application =
  models.Application || model("Application", applicationSchema);
