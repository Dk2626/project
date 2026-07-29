"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Users,
  Check,
  X,
  Clock,
  ArrowRight,
  Linkedin,
} from "lucide-react";
import { api } from "@/lib/client";
import type { RecruiterRecord, ApprovalStatus } from "@/lib/types";

type Filter = "all" | ApprovalStatus;

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function ApprovalBadge({ status }: { status?: ApprovalStatus }) {
  const map: Record<string, string> = {
    approved: "bg-success/10 text-success",
    pending: "bg-warning/10 text-warning",
    rejected: "bg-danger/10 text-danger",
  };
  const label =
    status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending approval";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        map[status ?? "pending"]
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

function Meta({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-dark">{value}</p>
      </div>
    </div>
  );
}

export default function AdminRecruitersPage() {
  const [recruiters, setRecruiters] = useState<RecruiterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api<RecruiterRecord[]>("/api/admin/recruiters")
      .then(setRecruiters)
      .catch(() => setRecruiters([]))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function setStatus(id: string, approvalStatus: ApprovalStatus) {
    if (
      approvalStatus !== "approved" &&
      !confirm(
        "Revoke this recruiter's access? Their job postings will be hidden from the website."
      )
    )
      return;

    setBusyId(id);
    setRecruiters((prev) =>
      prev.map((r) => (r._id === id ? { ...r, approvalStatus } : r))
    );
    try {
      await api(`/api/admin/recruiters/${id}`, {
        method: "PUT",
        body: JSON.stringify({ approvalStatus }),
      });
    } catch {
      alert("Could not update this recruiter.");
      load();
    } finally {
      setBusyId(null);
    }
  }

  const counts = {
    all: recruiters.length,
    pending: recruiters.filter((r) => (r.approvalStatus ?? "pending") === "pending").length,
    approved: recruiters.filter((r) => r.approvalStatus === "approved").length,
    rejected: recruiters.filter((r) => r.approvalStatus === "rejected").length,
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return recruiters
      .filter((r) => filter === "all" || (r.approvalStatus ?? "pending") === filter)
      .filter((r) => {
        if (!q) return true;
        return (
          `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q) ||
          (r.companyName ?? "").toLowerCase().includes(q) ||
          (r.phone ?? "").toLowerCase().includes(q)
        );
      });
  }, [recruiters, query, filter]);

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-dark">Recruiters</h1>
      <p className="mt-1 text-sm text-slate-500">
        Approve recruiter accounts and review the jobs and applicants behind each one.
      </p>

      {counts.pending > 0 && (
        <div className="mt-5 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <Clock className="h-4 w-4 shrink-0 text-warning" />
          <span className="text-slate-700">
            {counts.pending} recruiter{counts.pending === 1 ? "" : "s"} waiting for your approval.
          </span>
        </div>
      )}

      {/* Tabs + search */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 sm:w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
                filter === t.key ? "bg-primary text-white" : "text-slate-600 hover:bg-light"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or company"
            className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          [0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-white" />)
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 font-heading text-lg font-semibold text-dark">No recruiters here</p>
            <p className="mt-1 text-sm text-slate-500">
              Recruiter accounts appear here as soon as they register.
            </p>
          </div>
        ) : (
          filtered.map((r) => {
            const status = (r.approvalStatus ?? "pending") as ApprovalStatus;
            return (
              <div key={r._id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-heading font-semibold text-dark">
                        {r.companyName || "—"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {r.firstName} {r.lastName}
                        {r.designation ? ` · ${r.designation}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Registered {formatDate(r.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <ApprovalBadge status={status} />
                    {status !== "approved" && (
                      <button
                        disabled={busyId === r._id}
                        onClick={() => setStatus(r._id, "approved")}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-success px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                      >
                        <Check className="h-4 w-4" /> Approve
                      </button>
                    )}
                    {status !== "rejected" && (
                      <button
                        disabled={busyId === r._id}
                        onClick={() => setStatus(r._id, "rejected")}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:border-danger/40 hover:text-danger disabled:opacity-60"
                      >
                        <X className="h-4 w-4" /> {status === "approved" ? "Revoke" : "Reject"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Meta icon={Mail} label="Email" value={r.email} />
                  <Meta icon={Phone} label="Phone" value={r.phone} />
                  <Meta icon={MapPin} label="Location" value={r.companyLocation} />
                  <Meta icon={Briefcase} label="Industry" value={r.industry} />
                  <Meta icon={Users} label="Company Size" value={r.companySize} />
                  <Meta icon={Globe} label="Website" value={r.companyWebsite} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-dark">{r.jobCount ?? 0}</span> jobs posted
                    <span className="text-slate-400">({r.activeJobCount ?? 0} live)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-dark">{r.applicantCount ?? 0}</span> student
                    applications
                  </span>
                  {r.linkedin && (
                    <a
                      href={r.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      <Linkedin className="h-4 w-4" /> LinkedIn
                    </a>
                  )}
                  <Link
                    href={`/admin/recruiters/${r._id}`}
                    className="ml-auto inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    View jobs &amp; applicants <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
