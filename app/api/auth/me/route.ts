import { getSessionUser } from "@/lib/auth";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = getSessionUser();
  return ok({ user: user ?? null });
}
