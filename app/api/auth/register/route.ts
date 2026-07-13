import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  hashPassword,
  signToken,
  authCookieOptions,
  AUTH_COOKIE,
} from "@/lib/auth";
import { uploadToS3, validatePdf, isS3Configured } from "@/lib/s3";
import { ok, fail, handle, serialize } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const contentType = req.headers.get("content-type") ?? "";

    // We accept multipart/form-data so the resume PDF can ride along.
    let fields: Record<string, string> = {};
    let resumeFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const fd = await req.formData();
      for (const [k, v] of fd.entries()) {
        if (v instanceof File) {
          if (k === "resume" && v.size > 0) resumeFile = v;
        } else {
          fields[k] = String(v);
        }
      }
    } else {
      fields = await req.json();
    }

    const required = ["firstName", "lastName", "email", "password"] as const;
    for (const key of required) {
      if (!fields[key]?.trim()) return fail(`${key} is required.`);
    }

    const email = fields.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return fail("Please enter a valid email address.");
    if (fields.password.length < 8)
      return fail("Password must be at least 8 characters.");

    await connectDB();

    const existing = await User.findOne({ email }).lean();
    if (existing)
      return fail(
        "An account with this email already exists. Try logging in.",
        409
      );

    // Upload resume to S3 if one was provided.
    let resumeUrl: string | undefined;
    let resumeKey: string | undefined;
    if (resumeFile) {
      const err = validatePdf({
        type: resumeFile.type,
        size: resumeFile.size,
        name: resumeFile.name,
      });
      if (err) return fail(err);
      if (!isS3Configured())
        return fail(
          "File uploads are not configured on the server yet. Please try again later or register without a resume.",
          503
        );
      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      const uploaded = await uploadToS3(
        buffer,
        resumeFile.name,
        resumeFile.type || "application/pdf"
      );
      resumeUrl = uploaded.url;
      resumeKey = uploaded.key;
    }

    const passwordHash = await hashPassword(fields.password);

    const user = await User.create({
      firstName: fields.firstName.trim(),
      lastName: fields.lastName.trim(),
      email,
      phone: fields.phone,
      dob: fields.dob,
      gender: fields.gender,
      password: passwordHash,
      role: "student",
      college: fields.college,
      degree: fields.degree,
      department: fields.department,
      currentYear: fields.currentYear,
      graduationYear: fields.graduationYear,
      cgpa: fields.cgpa,
      linkedin: fields.linkedin,
      github: fields.github,
      resumeUrl,
      resumeKey,
    });

    const session = {
      id: user._id.toString(),
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role as "student",
    };
    cookies().set(AUTH_COOKIE, signToken(session), authCookieOptions());

    return ok({ user: session }, 201);
  });
}
