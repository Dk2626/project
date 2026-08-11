import { createHash } from "crypto";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { hashPassword, AUTH_COOKIE } from "@/lib/auth";
import { ok, fail, handle } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVALID =
  "This reset link is invalid or has expired. Please request a new one.";

/** Look a raw token up by its hash and confirm it is still usable. */
async function findLiveToken(raw: string) {
  const tokenHash = createHash("sha256").update(raw).digest("hex");
  const record: any = await PasswordResetToken.findOne({ tokenHash });
  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt.getTime() <= Date.now()) return null;
  return record;
}

/**
 * GET /api/auth/reset-password?token=…
 * Lets the page tell someone their link is dead *before* they type a new
 * password twice.
 */
export async function GET(req: Request) {
  return handle(async () => {
    const token = new URL(req.url).searchParams.get("token")?.trim();
    if (!token) return fail(INVALID, 400);

    await connectDB();
    const record = await findLiveToken(token);
    if (!record) return fail(INVALID, 400);

    const user: any = await User.findById(record.user).select("email").lean();
    if (!user) return fail(INVALID, 400);

    // Only enough to greet them — never the full account record.
    return ok({ valid: true, email: user.email });
  });
}

/** POST { token, password } — sets the new password and burns the link. */
export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json();
    const token = String(body?.token ?? "").trim();
    const password = String(body?.password ?? "");

    if (!token) return fail(INVALID, 400);
    if (!password) return fail("Enter a new password.");
    if (password.length < 8)
      return fail("Password must be at least 8 characters.");

    await connectDB();

    const record = await findLiveToken(token);
    if (!record) return fail(INVALID, 400);

    const user = await User.findById(record.user).select("+password");
    if (!user) return fail(INVALID, 400);

    user.password = await hashPassword(password);
    await user.save();

    // Mark it spent, then clear every other outstanding link for this account.
    record.usedAt = new Date();
    await record.save();
    await PasswordResetToken.deleteMany({
      user: user._id,
      _id: { $ne: record._id },
    });

    // Whoever is holding this browser session signs in fresh with the new password.
    cookies().delete(AUTH_COOKIE);

    return ok({
      message: "Your password has been updated. You can log in with it now.",
    });
  });
}
