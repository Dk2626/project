import { createHash, randomBytes } from "crypto";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { isMailConfigured, sendMail, passwordResetEmail } from "@/lib/mail";
import { findByEmail, normalizeEmail, isValidEmail } from "@/lib/users";
import { ok, fail, handle } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** How long a reset link stays valid. */
const RESET_TOKEN_TTL_MINUTES = 60;

/** Don't send a second email within this window (stops inbox flooding). */
const RESEND_COOLDOWN_MS = 60 * 1000;

/**
 * Shown when the address isn't in the users collection. The UI keys off the
 * 404 status to render the "not registered" panel with a Register link.
 */
const NOT_REGISTERED =
  "No account is registered with that email address. Check the spelling, or create an account first.";

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
    const address = normalizeEmail(email);

    if (!address) return fail("Enter your email address.");
    if (!isValidEmail(address)) return fail("Enter a valid email address.");

    // Surface a real error to the operator rather than silently doing nothing.
    if (!isMailConfigured())
      return fail(
        "Email is not configured on the server, so reset links can't be sent yet. Please contact the URAV team.",
        503
      );

    // Single source of truth for email lookups — hits the unique index on
    // `email`, and connects to Mongo for us.
    const user = await findByEmail(address, "_id firstName lastName email");

    // Unknown address: tell the visitor plainly instead of pretending we sent
    // a mail they'll never receive.
    if (!user) return fail(NOT_REGISTERED, 404);

    // Someone hammering the button shouldn't get ten emails.
    const recent = await PasswordResetToken.findOne({
      user: user._id,
      usedAt: { $exists: false },
      createdAt: { $gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
    }).lean();
    if (recent)
      return fail(
        "A reset link was just sent to this address. Please check your inbox (and spam folder) before requesting another.",
        429
      );

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

    return ok({
      email: user.email,
      message: `We've sent a password reset link to ${user.email}. Check your inbox (and spam folder).`,
    });
  });
}
