"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { isAdminRole, type Role } from "@/lib/types";

/** Where a signed-in user of this role belongs. */
export function landingFor(role?: Role | string): string {
  if (isAdminRole(role)) return "/admin";
  if (role === "recruiter") return "/recruiter";
  return "/dashboard";
}

/**
 * Client-side twin of the middleware rule: a signed-in visitor who lands on
 * /login or /register is sent to their own dashboard instead. The middleware
 * catches this before the page is served; this covers client-side navigation
 * (e.g. the browser back button after logging in) where no request is made.
 */
export function useRedirectIfAuthed() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    router.replace(landingFor(user.role));
  }, [user, loading, router]);

  return { user, loading };
}
