import mongoose, { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    dob: { type: String },
    gender: { type: String },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["student", "admin"],
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
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User = models.User || model("User", userSchema);
export type UserModel = typeof User;
