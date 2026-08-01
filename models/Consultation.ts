import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

/** Lifecycle of a consultation request, as shown in the admin tabs. */
export const CONSULTATION_STATUSES = [
  "New",
  "In Progress",
  "Responded",
  "Closed",
] as const;

export const CONSULTATION_TOPICS = [
  "Career Guidance",
  "Course Selection",
  "Higher Studies",
  "Job Search",
  "Resume Review",
  "Interview Preparation",
  "Webinar / Training",
  "Other",
] as const;

export const CONSULTATION_MODES = ["Email", "Phone Call", "Video Call"] as const;

const consultationSchema = new Schema(
  {
    /**
     * Set when the sender was logged in. Left empty for a visitor who filled
     * the public form without an account — the contact details below are then
     * the only way to reach them, which is why they're stored on the document
     * rather than being read off the User record each time.
     */
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },

    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },

    studentType: {
      type: String,
      enum: ["School Student", "College Student", "Other"],
      default: "College Student",
    },
    institution: { type: String, trim: true },

    topic: { type: String, enum: CONSULTATION_TOPICS, default: "Career Guidance" },
    preferredMode: { type: String, enum: CONSULTATION_MODES, default: "Email" },
    /** Free text — "weekday evenings", "after 6pm" etc. */
    preferredTime: { type: String, trim: true },

    message: { type: String, required: true, trim: true, maxlength: 4000 },

    status: {
      type: String,
      enum: CONSULTATION_STATUSES,
      default: "New",
      index: true,
    },

    /** The team's reply. Visible to the student on their requests list. */
    response: { type: String, trim: true, default: "", maxlength: 4000 },
    /** Admin-only scratchpad — never returned to the student. */
    internalNote: { type: String, trim: true, default: "", maxlength: 2000 },

    handledBy: { type: Schema.Types.ObjectId, ref: "User" },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

// The admin list is always "newest first, optionally filtered by status".
consultationSchema.index({ status: 1, createdAt: -1 });
consultationSchema.index({ createdAt: -1 });

export type ConsultationDoc = InferSchemaType<typeof consultationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Consultation =
  models.Consultation || model("Consultation", consultationSchema);
