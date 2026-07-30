import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The JWT is a snapshot from login time, so role and approval state are
 * topped up from the database on every call. That means promoting someone
 * to "superadmin" (or approving a recruiter) takes effect immediately,
 * without them having to log out and back in.
 */
export async function GET() {
  const session = getSessionUser();
  if (!session) return ok({ user: null });

  try {
    await connectDB();
    const me: any = await User.findById(session.id)
      .select("role approvalStatus companyName firstName lastName")
      .lean();

    if (!me) return ok({ user: null });

    return ok({
      user: {
        ...session,
        name: `${me.firstName} ${me.lastName}`,
        role: me.role ?? session.role,
        approvalStatus: me.approvalStatus ?? "approved",
        companyName: me.companyName ?? "",
      },
    });
  } catch {
    // Database hiccup — fall back to whatever the cookie says.
    return ok({ user: session });
  }
}
