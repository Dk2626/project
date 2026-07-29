import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";

/**
 * Lightweight gate. Middleware runs on the Edge runtime where the JWT library
 * isn't available, so we only check that a token cookie is present here and do
 * full verification + role checks in the API routes (nodejs runtime) and the
 * admin layout. This just avoids flashing protected pages to logged-out users.
 */
const PROTECTED = ["/dashboard", "/admin", "/recruiter"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/recruiter/:path*"],
};
