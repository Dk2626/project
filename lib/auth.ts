import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { AUTH_COOKIE } from "./constants";

const JWT_SECRET = process.env.JWT_SECRET;
export { AUTH_COOKIE };
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Role = "student" | "recruiter" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

function secret(): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set. Add it to .env.local (see .env.example).");
  }
  return JWT_SECRET;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(user, secret(), { expiresIn: MAX_AGE });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, secret()) as jwt.JwtPayload & SessionUser;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

/** Set the auth cookie in a Route Handler (httpOnly, so JS can't read the token). */
export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  };
}

/** Read the current user from the request cookie (Server Components / Route Handlers). */
export function getSessionUser(): SessionUser | null {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Same but for a NextRequest (used inside middleware / route handlers that receive req). */
export function getSessionUserFromRequest(req: NextRequest): SessionUser | null {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
