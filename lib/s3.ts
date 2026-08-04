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

/**
 * Hero/banner images can live in their own bucket (they are public, while
 * resumes usually are not). If AWS_S3_HERO_BUCKET isn't set we fall back to
 * the main bucket and just keep the images under the `hero/` prefix.
 */
const heroBucket = process.env.AWS_S3_HERO_BUCKET || bucket;

export const RESUME_BUCKET = bucket;
export const HERO_BUCKET = heroBucket;

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

/** True when the given bucket (default: the resume bucket) is usable. */
export function isS3Configured(bucketName = bucket): boolean {
  return Boolean(region && bucketName && accessKeyId && secretAccessKey);
}

/** Public base URL for a bucket — CDN/custom domain when one is configured. */
function publicBase(bucketName: string): string {
  if (bucketName === heroBucket && process.env.AWS_S3_HERO_PUBLIC_BASE_URL) {
    return process.env.AWS_S3_HERO_PUBLIC_BASE_URL;
  }
  if (bucketName === bucket && process.env.AWS_S3_PUBLIC_BASE_URL) {
    return process.env.AWS_S3_PUBLIC_BASE_URL;
  }
  return `https://${bucketName}.s3.${region}.amazonaws.com`;
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
  folder = "resumes",
  bucketName: string | undefined = bucket
): Promise<UploadResult> {
  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET is not set.");
  }

  const client = getClient();
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${folder}/${randomUUID()}-${safeName}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Hero images are static marketing assets — let the CDN hold on to them.
      CacheControl: folder === "hero" ? "public, max-age=31536000, immutable" : undefined,
    })
  );

  return { url: `${publicBase(bucketName)}/${key}`, key };
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

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"];

/** Validate an uploaded file is a web-safe image within the size limit. */
export function validateImage(
  file: { type: string; size: number; name: string },
  maxBytes = 8 * 1024 * 1024
): string | null {
  const name = file.name.toLowerCase();
  const looksLikeImage =
    IMAGE_MIME_TYPES.includes(file.type) ||
    IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!looksLikeImage)
    return "Only JPG, PNG, WebP, AVIF or GIF images are allowed.";
  if (file.size > maxBytes)
    return `Image is too large. Maximum size is ${Math.round(
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
export function keyFromUrl(
  url?: string | null,
  bucketName: string | undefined = bucket
): string | null {
  if (!url) return null;
  // Slides seeded with the built-in defaults point at /public, not at S3.
  if (url.startsWith("/")) return null;
  try {
    const parsed = new URL(url);
    const path = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    if (!path) return null;

    // Path-style URL: https://s3.<region>.amazonaws.com/<bucket>/<key>
    if (bucketName && path.startsWith(`${bucketName}/`)) {
      return path.slice(bucketName.length + 1);
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
export async function deleteFromS3(
  key?: string | null,
  bucketName: string | undefined = bucket
): Promise<boolean> {
  if (!key || !bucketName || !isS3Configured(bucketName)) return false;
  try {
    await getClient().send(
      new DeleteObjectCommand({ Bucket: bucketName, Key: key })
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
