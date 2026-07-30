import { User } from "@/models/User";
import { connectDB } from "@/lib/db";
import { HttpError } from "@/lib/api";
import {
  uploadToS3,
  validatePdf,
  isS3Configured,
  deleteResume,
} from "@/lib/s3";

export interface ReplaceResumeResult {
  resumeUrl: string;
  resumeKey: string;
  /** Whether the previous file was successfully removed from the bucket. */
  oldRemoved: boolean;
}

/**
 * Pull the `resume` file off a multipart request body.
 * Returns null when the field is missing or empty.
 */
export async function readResumeFile(req: Request): Promise<File | null> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    throw new HttpError(400, "Send the file as multipart/form-data.");
  }
  const fd = await req.formData();
  const file = fd.get("resume");
  if (!(file instanceof File) || file.size === 0) return null;
  return file;
}

/**
 * Replace a user's CV.
 *
 * Order matters: upload first, persist the new pointer, and only then
 * delete the old object. If the upload or the DB write fails we've still
 * got the previous CV intact — the worst case is one orphaned file, never
 * a student left with no resume at all.
 */
export async function replaceResume(
  userId: string,
  file: File
): Promise<ReplaceResumeResult> {
  const invalid = validatePdf({
    type: file.type,
    size: file.size,
    name: file.name,
  });
  if (invalid) throw new HttpError(400, invalid);

  if (!isS3Configured()) {
    throw new HttpError(
      503,
      "File uploads are not configured on the server yet. Please try again later."
    );
  }

  await connectDB();

  const existing: any = await User.findById(userId)
    .select("resumeUrl resumeKey")
    .lean();
  if (!existing) throw new HttpError(404, "That account could not be found.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadToS3(
    buffer,
    file.name,
    file.type || "application/pdf"
  );

  await User.findByIdAndUpdate(userId, {
    $set: { resumeUrl: uploaded.url, resumeKey: uploaded.key },
  });

  // Old file is now unreferenced — clear it out of the bucket.
  let oldRemoved = false;
  const sameObject = existing.resumeKey === uploaded.key;
  if (!sameObject) {
    oldRemoved = await deleteResume(existing.resumeKey, existing.resumeUrl);
  }

  return { resumeUrl: uploaded.url, resumeKey: uploaded.key, oldRemoved };
}

/** Drop a user's CV entirely — clears both the DB pointer and the S3 object. */
export async function removeResume(userId: string): Promise<boolean> {
  await connectDB();
  const existing: any = await User.findById(userId)
    .select("resumeUrl resumeKey")
    .lean();
  if (!existing) throw new HttpError(404, "That account could not be found.");

  await User.findByIdAndUpdate(userId, {
    $unset: { resumeUrl: "", resumeKey: "" },
  });

  return deleteResume(existing.resumeKey, existing.resumeUrl);
}
