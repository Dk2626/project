import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = getSessionUser();
  if (!session) return ok({ user: null });

  // Recruiters need their live approval state (an admin may have approved
  // them after the cookie was issued), so top it up from the database.
  if (session.role === "recruiter") {
    try {
      await connectDB();
      const me: any = await User.findById(session.id)
        .select("approvalStatus companyName")
        .lean();
      return ok({
        user: {
          ...session,
          approvalStatus: me?.approvalStatus ?? "pending",
          companyName: me?.companyName ?? "",
        },
      });
    } catch {
      return ok({ user: { ...session, approvalStatus: "pending" } });
    }
  }

  return ok({ user: session });
}
