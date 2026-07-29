import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  verifyPassword,
  signToken,
  authCookieOptions,
  AUTH_COOKIE,
} from "@/lib/auth";
import { ok, fail, handle } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const { email, password } = await req.json();
    if (!email || !password)
      return fail("Email and password are required.");

    await connectDB();

    // password has select:false, so ask for it explicitly.
    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select(
      "+password"
    );
    if (!user) return fail("Invalid email or password.", 401);

    const valid = await verifyPassword(password, user.password);
    if (!valid) return fail("Invalid email or password.", 401);

    const session = {
      id: user._id.toString(),
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
    };
    cookies().set(AUTH_COOKIE, signToken(session), authCookieOptions());

    // Recruiters also get their approval state so the UI can immediately
    // show either their dashboard or the "waiting for admin" notice.
    if (user.role === "recruiter") {
      return ok({
        user: {
          ...session,
          approvalStatus: user.approvalStatus ?? "pending",
          companyName: user.companyName ?? "",
        },
      });
    }

    return ok({ user: session });
  });
}
