"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  CheckCircle2,
  Star,
  ArrowRight,
  Plus,
  BadgeCheck,
} from "lucide-react";
import { api } from "@/lib/client";
import { useAuth } from "@/components/AuthProvider";
import { ApprovalNotice } from "@/components/ApprovalNotice";
import type { ApprovalStatus } from "@/lib/types";

interface RecruiterStats {
  approvalStatus: ApprovalStatus;
  companyName: string;
  rejectionReason?: string;
  jobs: number;
  activeJobs: number;
  applicants: number;
  shortlisted: number;
  hired: number;
}

export default function RecruiterOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<RecruiterStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<RecruiterStats>("/api/recruiter/stats")
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const status: ApprovalStatus =
    stats?.approvalStatus ?? user?.approvalStatus ?? "pending";

  const cards = [
    { label: "Jobs Posted", value: stats?.jobs, icon: Briefcase, href: "/recruiter/jobs" },
    { label: "Active Jobs", value: stats?.activeJobs, icon: BadgeCheck, href: "/recruiter/jobs" },
    { label: "Total Applicants", value: stats?.applicants, icon: Users, href: "/recruiter/applicants" },
    { label: "Shortlisted", value: stats?.shortlisted, icon: Star, href: "/recruiter/applicants" },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-dark">
        Hi {user?.name?.split(" ")[0] ?? "there"} 👋
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {stats?.companyName || user?.companyName
          ? `Hiring dashboard for ${stats?.companyName || user?.companyName}.`
          : "Your hiring dashboard."}
      </p>

      {loading ? (
        <div className="mt-6 h-40 animate-pulse rounded-xl bg-white" />
      ) : status !== "approved" ? (
        <div className="mt-6">
          <ApprovalNotice status={status} reason={stats?.rejectionReason} />
        </div>
      ) : (
        <>
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
                <p className="mt-4 font-heading text-3xl font-bold text-dark">{value ?? 0}</p>
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
                  <p className="font-heading font-semibold text-dark">Post a new job</p>
                  <p className="text-sm text-slate-500">
                    It goes live on the website straight away.
                  </p>
                </div>
              </div>
              <Link
                href="/recruiter/jobs"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
              >
                <Plus className="h-4 w-4" /> Create job
              </Link>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-light text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-heading font-semibold text-dark">Hired</p>
                  <p className="text-sm text-slate-500">
                    {stats?.hired ?? 0} candidate{(stats?.hired ?? 0) === 1 ? "" : "s"} accepted
                  </p>
                </div>
              </div>
              <Link
                href="/recruiter/applicants"
                className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
              >
                View applicants
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
