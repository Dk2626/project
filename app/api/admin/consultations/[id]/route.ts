import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { Consultation, CONSULTATION_STATUSES } from "@/models/Consultation";
import {
  ok,
  fail,
  handle,
  serialize,
  requireAdmin,
  requireSuperAdmin,
} from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const POPULATE = [
  { path: "user", select: "firstName lastName email phone resumeUrl studentType" },
  { path: "handledBy", select: "firstName lastName email" },
];

/** Any admin may read one request in full. */
export async function GET(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireAdmin();
    if (!isValidObjectId(params.id)) return fail("Request not found.", 404);

    await connectDB();
    const item = await Consultation.findById(params.id)
      .populate(POPULATE)
      .lean();
    if (!item) return fail("Request not found.", 404);

    return ok(serialize(item));
  });
}

/**
 * PATCH — admin or superadmin updates the status, writes the reply the
 * student will see, or leaves an internal note.
 *
 * Whoever last touched the request is recorded in `handledBy`, so it's clear
 * on a shared inbox who picked something up.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  return handle(async () => {
    const admin = await requireAdmin();
    if (!isValidObjectId(params.id)) return fail("Request not found.", 404);

    const body = await req.json().catch(() => ({}));
    const update: Record<string, any> = {};

    if ("status" in body) {
      if (!(CONSULTATION_STATUSES as readonly string[]).includes(body.status))
        return fail("That status isn't valid.");
      update.status = body.status;
    }

    if ("response" in body) {
      const response = String(body.response ?? "").trim();
      if (response.length > 4000)
        return fail("That reply is too long — please keep it under 4000 characters.");
      update.response = response;
      if (response) update.respondedAt = new Date();
    }

    if ("internalNote" in body) {
      const note = String(body.internalNote ?? "").trim();
      if (note.length > 2000)
        return fail("That note is too long — please keep it under 2000 characters.");
      update.internalNote = note;
    }

    if (Object.keys(update).length === 0)
      return fail("Nothing to update.");

    update.handledBy = admin.id;

    await connectDB();
    const item = await Consultation.findByIdAndUpdate(
      params.id,
      { $set: update },
      { new: true, runValidators: true }
    )
      .populate(POPULATE)
      .lean();

    if (!item) return fail("Request not found.", 404);
    return ok(serialize(item));
  });
}

/** Superadmin only — deleting a request loses the enquiry for good. */
export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await requireSuperAdmin();
    if (!isValidObjectId(params.id)) return fail("Request not found.", 404);

    await connectDB();
    const result = await Consultation.deleteOne({ _id: params.id });
    if (result.deletedCount === 0) return fail("Request not found.", 404);

    return ok({ deleted: true });
  });
}
