import { createHash, randomBytes } from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { isMailConfigured, sendMail, passwordResetEmail } from "@/lib/mail";
import { ok, fail, handle } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** How long a reset link stays valid. */
export const RESET_TOKEN_TTL_MINUTES = 60;

/** Don't send a second email within this window (stops inbox flooding). */
const RESEND_COOLDOWN_MS = 60 * 1000;

/**
 * The same reply goes out whether or not the address exists, so this endpoint
 * can't be used to find out who has an account here.
 */
const GENERIC_REPLY =
  "If that email is registered with us, a reset link is on its way. Check your inbox (and spam folder).";

/** Public origin used to build the link in the email. */
function baseUrl(req: Request): string {
  const configured = process.env.APP_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  // Fallback for local dev, where APP_URL usually isn't set.
  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  return handle(async () => {
    const { email } = await req.json();
    const address = String(email ?? "").toLowerCase().trim();

    if (!address) return fail("Enter your email address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
      return fail("Enter a valid email address.");

    // Surface a real error to the operator rather than silently doing nothing.
    if (!isMailConfigured())
      return fail(
        "Email is not configured on the server, so reset links can't be sent yet. Please contact the URAV team.",
        503
      );

    await connectDB();

    const user = await User.findOne({ email: address }).select(
      "_id firstName lastName email"
    );

    // Unknown address: stop here, but reply exactly as if we had sent one.
    if (!user) return ok({ message: GENERIC_REPLY });

    // Someone hammering the button shouldn't get ten emails.
    const recent = await PasswordResetToken.findOne({
      user: user._id,
      usedAt: { $exists: false },
      createdAt: { $gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
    }).lean();
    if (recent) return ok({ message: GENERIC_REPLY });

    // Any older link for this account stops working the moment a new one is issued.
    await PasswordResetToken.deleteMany({ user: user._id });

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
    });

    const link = `${baseUrl(req)}/reset-password?token=${token}`;

    try {
      await sendMail({
        to: user.email,
        ...passwordResetEmail({
          name: user.firstName ?? "",
          link,
          minutes: RESET_TOKEN_TTL_MINUTES,
        }),
      });
    } catch (err) {
      // Don't leave a live token behind for an email that never arrived.
      await PasswordResetToken.deleteOne({ tokenHash });
      console.error("[forgot-password] send failed", err);
      return fail(
        "We couldn't send the reset email just now. Please try again in a few minutes.",
        502
      );
    }

    return ok({ message: GENERIC_REPLY });
  });
}
