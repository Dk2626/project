"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  FileText,
  Search,
  Mail,
  Phone,
  GraduationCap,
  ExternalLink,
  Linkedin,
  Github,
  ChevronDown,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { ApprovalNotice } from "@/components/ApprovalNotice";
import { api } from "@/lib/client";
import type { ApplicationItem, JobItem, ApprovalStatus } from "@/lib/types";

const JOB_STATUSES = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview",
  "Rejected",
  "Accepted",
];

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function RecruiterApplicantsPage() {
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ApprovalStatus>("pending");
  const [rejectionReason, setRejectionReason] = useState("");
  const [query, setQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function load() {
    Promise.all([
      api<ApplicationItem[]>("/api/applications").catch(() => []),
      api<JobItem[]>("/api/jobs?mine=1").catch(() => []),
    ]).then(([a, j]) => {
      setApps(a);
      setJobs(j);
    });
  }

  useEffect(() => {
    setLoading(true);
    api<any>("/api/recruiter/stats")
      .then((s) => {
        setStatus(s.approvalStatus);
        setRejectionReason(s.rejectionReason ?? "");
        if (s.approvalStatus === "approved") load();
      })
      .catch(() => setStatus("pending"))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, next: string) {
    setUpdatingId(id);
    setApps((prev) => prev.map((a) => (a._id === id ? { ...a, status: next } : a)));
    try {
      await api(`/api/applications/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: next }),
      });
    } catch {
      alert("Could not update status.");
      load();
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return apps
      .filter((a) => jobFilter === "all" || (a.job as any)?._id === jobFilter)
      .filter((a) => statusFilter === "all" || a.status === statusFilter)
      .filter((a) => {
        if (!q) return true;
        const u = a.user;
        return (
          `${u?.firstName} ${u?.lastName}`.toLowerCase().includes(q) ||
          (u?.email ?? "").toLowerCase().includes(q) ||
          (a.job?.title ?? "").toLowerCase().includes(q)
        );
      });
  }, [apps, query, jobFilter, statusFilter]);

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl bg-white" />;
  }

  if (status !== "approved") {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-dark">Applicants</h1>
        <p className="mt-1 text-sm text-slate-500">Students who applied to your jobs.</p>
        <div className="mt-6">
          <ApprovalNotice status={status} reason={rejectionReason} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-dark">Applicants</h1>
      <p className="mt-1 text-sm text-slate-500">
        Every student who applied to a job you posted ({apps.length} total).
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          <FilterSelect
            value={jobFilter}
            onChange={setJobFilter}
            options={[
              { value: "all", label: `All jobs (${apps.length})` },
              ...jobs.map((j) => ({
                value: j._id,
                label: `${j.title} (${apps.filter((a) => (a.job as any)?._id === j._id).length})`,
              })),
            ]}
          />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All statuses" },
              ...JOB_STATUSES.map((s) => ({ value: s, label: s })),
            ]}
          />
        </div>

        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or job title"
            className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 font-heading text-lg font-semibold text-dark">No applicants yet</p>
            <p className="mt-1 text-sm text-slate-500">
              They&apos;ll appear here as students apply to your jobs.
            </p>
          </div>
        ) : (
          filtered.map((a) => {
            const u = a.user;
            const resume = a.resumeUrl || u?.resumeUrl;
            return (
              <div key={a._id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-light font-heading font-semibold text-primary">
                      {(u?.firstName?.[0] ?? "?").toUpperCase()}
                    </span>
                    <div>
                      <p className="font-heading font-semibold text-dark">
                        {u ? `${u.firstName} ${u.lastName}` : "Unknown student"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        {u?.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {u.email}
                          </span>
                        )}
                        {u?.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {u.phone}
                          </span>
                        )}
                        {((u as any)?.college || (u as any)?.schoolName) && (
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />{" "}
                            {(u as any).college || (u as any).schoolName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={a.status} />
                    <select
                      value={a.status}
                      disabled={updatingId === a._id}
                      onChange={(e) => updateStatus(a._id, e.target.value)}
                      className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {JOB_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-500">
                    Applied for:{" "}
                    <span className="font-medium text-dark">{a.job?.title ?? "—"}</span>
                  </span>
                  <span className="text-slate-400">{formatDate(a.createdAt)}</span>
                  {resume ? (
                    <a
                      href={resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" /> View resume
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">No resume on file</span>
                  )}
                  {(u as any)?.linkedin && (
                    <a
                      href={(u as any).linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      <Linkedin className="h-4 w-4" /> LinkedIn
                    </a>
                  )}
                  {(u as any)?.github && (
                    <a
                      href={(u as any).github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      <Github className="h-4 w-4" /> GitHub
                    </a>
                  )}
                </div>

                {a.note && (
                  <p className="mt-3 rounded-md bg-light px-3 py-2 text-sm text-slate-600">
                    “{a.note}”
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
