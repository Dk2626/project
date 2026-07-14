import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ok, handle, serialize, requireAdmin } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: admin -> every registered student with their registration details.
export async function GET() {
  return handle(async () => {
    requireAdmin();
    await connectDB();

    const students = await User.find({ role: "student" })
      .sort({ createdAt: -1 })
      .select("-password")
      .lean();

    return ok(students.map(serialize));
  });
}
