"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Video,
  Users,
  LogOut,
  GraduationCap,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/webinars", label: "Webinars", icon: Video },
  { href: "/admin/applications", label: "Applications", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login?redirect=/admin");
    else if (user.role !== "admin") router.replace("/");
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center bg-light">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-light lg:flex">
      {/* Sidebar */}
      <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between p-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-heading text-lg font-bold text-dark">URAV Admin</span>
          </Link>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-light hover:text-primary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-slate-100 p-3 lg:mt-auto lg:block">
          <Link
            href="/"
            className="mb-1 inline-flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-light"
          >
            <ExternalLink className="h-4 w-4" /> View site
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-light hover:text-danger"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1">
        <div className="mx-auto max-w-6xl p-5 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
