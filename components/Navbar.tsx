"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Menu, X, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { navLinks } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/AuthProvider";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-heading text-xl font-bold text-dark">URAV</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <span className="h-9 w-24 animate-pulse rounded-md bg-slate-100" />
          ) : user ? (
            <>
              {user.role === "admin" ? (
                <Button variant="ghost" size="sm" href="/admin">
                  <Shield className="h-4 w-4" /> Admin
                </Button>
              ) : (
                <Button variant="ghost" size="sm" href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Button>
              )}
              <span className="hidden text-sm font-medium text-slate-600 lg:inline">
                {user.name.split(" ")[0]}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-medium text-dark transition-colors hover:bg-light"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" href="/login">
                Login
              </Button>
              <Button variant="primary" size="sm" href="/register">
                Register
              </Button>
            </>
          )}
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-md text-dark md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <ul className="container-page flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="block rounded-md px-2 py-2 text-sm font-medium text-slate-600 hover:bg-light hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}

            {user ? (
              <>
                <li>
                  <Link
                    href={user.role === "admin" ? "/admin" : "/dashboard"}
                    className="block rounded-md px-2 py-2 text-sm font-medium text-primary hover:bg-light"
                    onClick={() => setOpen(false)}
                  >
                    {user.role === "admin" ? "Admin Panel" : "My Dashboard"}
                  </Link>
                </li>
                <li className="mt-2 px-2">
                  <button
                    onClick={handleLogout}
                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-medium text-dark hover:bg-light"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="mt-2 flex gap-3 px-2">
                <Button variant="outline" size="sm" href="/login" className="flex-1">
                  Login
                </Button>
                <Button variant="primary" size="sm" href="/register" className="flex-1">
                  Register
                </Button>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
