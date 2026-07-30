import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth";
import { ok, fail, handle, serialize, requireSuperAdmin } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/**
 * PUT — edit an admin's name / phone, or reset their password.
 * A superadmin account cannot be edited through here.
 */
export async function PUT(req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireSuperAdmin();
    if (!isValidObjectId(params.id)) return fail("Admin not found.", 404);

    const body = await req.json();
    const update: Record<string, any> = {};

    if ("firstName" in body) {
      const v = String(body.firstName).trim();
      if (!v) return fail("First name cannot be empty.");
      update.firstName = v;
    }
    if ("lastName" in body) {
      const v = String(body.lastName).trim();
      if (!v) return fail("Last name cannot be empty.");
      update.lastName = v;
    }
    if ("phone" in body) update.phone = String(body.phone).trim();

    if (body.password) {
      const pw = String(body.password);
      if (pw.length < 8)
        return fail("Password must be at least 8 characters.");
      update.password = await hashPassword(pw);
    }

    await connectDB();

    const admin = await User.findOneAndUpdate(
      { _id: params.id, role: "admin" },
      { $set: update },
      { new: true, runValidators: true }
    )
      .select("-password")
      .lean();

    if (!admin)
      return fail("Admin not found, or that account is a superadmin.", 404);

    return ok(serialize(admin));
  });
}

/** DELETE — remove an admin account. Superadmins are protected. */
export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    const me = await requireSuperAdmin();
    if (!isValidObjectId(params.id)) return fail("Admin not found.", 404);
    if (params.id === me.id)
      return fail("You can't remove your own account.", 400);

    await connectDB();

    const target: any = await User.findById(params.id).select("role").lean();
    if (!target) return fail("Admin not found.", 404);
    if (target.role === "superadmin")
      return fail("A superadmin account can't be removed here.", 403);
    if (target.role !== "admin") return fail("That user is not an admin.", 400);

    await User.deleteOne({ _id: params.id });
    return ok({ deleted: true });
  });
}
