import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";

/**
 * Lightweight gate. Middleware runs on the Edge runtime where the JWT library
 * isn't available, so we only check that a token cookie is present here and do
 * full verification + role checks in the API routes (nodejs runtime) and the
 * admin layout. This just avoids flashing protected pages to logged-out users.
 */
const PROTECTED = ["/dashboard", "/admin", "/recruiter"];

/** Pages that make no sense once you are signed in. */
const AUTH_PAGES = ["/login", "/register"];

/**
 * Read the payload of the JWT *without* verifying it.
 *
 * The signature can't be checked on the Edge runtime, and it doesn't need to
 * be: this is only used to pick which dashboard to bounce an already-signed-in
 * visitor to. Every protected page and API route still verifies properly.
 * Returns null for a missing, malformed or expired token, so a stale cookie
 * never traps someone on the wrong side of the login page.
 */
function readToken(token?: string): { role?: string } | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "="));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload?.exp && Date.now() >= payload.exp * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Where a signed-in user of this role belongs. */
function landingFor(role?: string): string {
  if (role === "admin" || role === "superadmin") return "/admin";
  if (role === "recruiter") return "/recruiter";
  return "/dashboard";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const matches = (list: string[]) =>
    list.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const token = req.cookies.get(AUTH_COOKIE)?.value;

  // Already signed in? /login and /register have nothing to offer.
  if (matches(AUTH_PAGES)) {
    const payload = readToken(token);
    if (!payload) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = landingFor(payload.role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!matches(PROTECTED)) return NextResponse.next();

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/recruiter/:path*",
    "/login",
    "/register/:path*",
    "/register",
  ],
};
