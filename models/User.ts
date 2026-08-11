import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

export const APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;

export const ROLES = ["student", "recruiter", "admin", "superadmin"] as const;
export type UserRole = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    /**
     * Always stored lowercase + trimmed. `unique: true` builds a unique
     * B-tree index on this path, which is what makes `findByEmail()` an
     * index seek instead of a collection scan — login, registration and the
     * forgot-password lookup all go through it.
     */
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    dob: { type: String },
    gender: { type: String },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["student", "recruiter", "admin", "superadmin"],
      default: "student",
      index: true,
    },

    // Education
    studentType: {
      type: String,
      enum: ["School Student", "College Student"],
      default: "College Student",
    },
    // College fields
    college: { type: String, trim: true },
    degree: { type: String },
    department: { type: String, trim: true },
    currentYear: { type: String },
    // School fields
    schoolName: { type: String, trim: true },
    classGrade: { type: String },
    board: { type: String },
    schoolStream: { type: String },
    // Shared
    graduationYear: { type: String },
    cgpa: { type: String },

    // Links + resume (S3 URL stored here)
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    resumeUrl: { type: String },
    resumeKey: { type: String },

    /* ------------------------------------------------------------------ */
    /* Recruiter fields (only populated when role === "recruiter")          */
    /* ------------------------------------------------------------------ */
    companyName: { type: String, trim: true },
    designation: { type: String, trim: true },
    companyWebsite: { type: String, trim: true },
    companyLocation: { type: String, trim: true },
    industry: { type: String, trim: true },
    companySize: { type: String },
    companyAbout: { type: String, trim: true },

    /**
     * Access gate for recruiters. A freshly registered recruiter is
     * "pending" and cannot post jobs until an admin approves them.
     * Students / admins are always "approved" so the same guard can be
     * used everywhere without special-casing.
     */
    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: "approved",
      index: true,
    },
    approvedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true }
);

/* Indexes that keep the paginated admin lists fast as the table grows. */
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ role: 1, approvalStatus: 1, createdAt: -1 });

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User = models.User || model("User", userSchema);
export type UserModel = typeof User;
