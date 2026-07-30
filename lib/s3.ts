import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS S3 is not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local (see .env.example)."
    );
  }
  if (!_client) {
    _client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _client;
}

export function isS3Configured(): boolean {
  return Boolean(region && bucket && accessKeyId && secretAccessKey);
}

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Upload a file buffer to S3 under the given folder and return its public URL.
 * The URL is what we persist in MongoDB.
 */
export async function uploadToS3(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder = "resumes"
): Promise<UploadResult> {
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is not set.");
  }

  const client = getClient();
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${folder}/${randomUUID()}-${safeName}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  // If you serve files through a CDN/custom domain, set AWS_S3_PUBLIC_BASE_URL.
  const base =
    process.env.AWS_S3_PUBLIC_BASE_URL ??
    `https://${bucket}.s3.${region}.amazonaws.com`;

  return { url: `${base}/${key}`, key };
}

/** Validate an uploaded file is a PDF within the size limit. */
export function validatePdf(
  file: { type: string; size: number; name: string },
  maxBytes = 5 * 1024 * 1024
): string | null {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Only PDF files are allowed.";
  if (file.size > maxBytes)
    return `File is too large. Maximum size is ${Math.round(
      maxBytes / (1024 * 1024)
    )}MB.`;
  return null;
}

/* ------------------------------------------------------------------ */
/* Deleting                                                            */
/* ------------------------------------------------------------------ */

/**
 * Recover the object key from a stored public URL.
 *
 * Records created before we started saving `resumeKey` only have the URL,
 * so this lets us still clean the old file out of the bucket. Returns null
 * if the URL doesn't look like it belongs to our bucket.
 */
export function keyFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const path = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    if (!path) return null;

    // Path-style URL: https://s3.<region>.amazonaws.com/<bucket>/<key>
    if (bucket && path.startsWith(`${bucket}/`)) {
      return path.slice(bucket.length + 1);
    }
    return path;
  } catch {
    return null;
  }
}

/**
 * Remove an object from the bucket. Never throws — a failed cleanup must
 * not fail the request that replaced the file, so problems are logged and
 * `false` is returned instead.
 */
export async function deleteFromS3(key?: string | null): Promise<boolean> {
  if (!key || !bucket || !isS3Configured()) return false;
  try {
    await getClient().send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key })
    );
    return true;
  } catch (err) {
    console.error("[s3] Could not delete", key, err);
    return false;
  }
}

/**
 * Delete whichever of the two we can resolve — preferring the stored key
 * and falling back to parsing the old URL.
 */
export async function deleteResume(
  resumeKey?: string | null,
  resumeUrl?: string | null
): Promise<boolean> {
  const key = resumeKey || keyFromUrl(resumeUrl);
  return deleteFromS3(key);
}
