"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Video, Users, FileText, GraduationCap, ArrowRight } from "lucide-react";
import { api } from "@/lib/client";

interface Stats {
  students: number;
  jobs: number;
  webinars: number;
  jobApplications: number;
  webinarApplications: number;
  totalApplications: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Stats>("/api/admin/stats")
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Students", value: stats?.students, icon: GraduationCap, href: "/admin/applications" },
    { label: "Jobs Posted", value: stats?.jobs, icon: Briefcase, href: "/admin/jobs" },
    { label: "Webinars", value: stats?.webinars, icon: Video, href: "/admin/webinars" },
    {
      label: "Total Applications",
      value: stats?.totalApplications,
      icon: FileText,
      href: "/admin/applications",
    },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-dark">Overview</h1>
      <p className="mt-1 text-sm text-slate-500">
        A snapshot of activity across the platform.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-light text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-4 font-heading text-3xl font-bold text-dark">
              {loading ? "—" : value ?? 0}
            </p>
            <p className="text-sm text-slate-500">{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-light text-primary">
              <Briefcase className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading font-semibold text-dark">Job applications</p>
              <p className="text-sm text-slate-500">
                {loading ? "—" : stats?.jobApplications ?? 0} received
              </p>
            </div>
          </div>
          <Link
            href="/admin/jobs"
            className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Manage jobs
          </Link>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-light text-primary">
              <Video className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading font-semibold text-dark">Webinar registrations</p>
              <p className="text-sm text-slate-500">
                {loading ? "—" : stats?.webinarApplications ?? 0} registered
              </p>
            </div>
          </div>
          <Link
            href="/admin/webinars"
            className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Manage webinars
          </Link>
        </div>
      </div>
    </div>
  );
}
