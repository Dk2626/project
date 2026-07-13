import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  cookies().delete(AUTH_COOKIE);
  return ok({ loggedOut: true });
}
