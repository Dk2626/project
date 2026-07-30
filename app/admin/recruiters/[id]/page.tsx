"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Users,
  Check,
  X,
  FileText,
  ExternalLink,
  GraduationCap,
  Search,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/client";
import { SkeletonProfile, SkeletonList } from "@/components/ui/Skeleton";
import type {
  ApplicationItem,
  JobItem,
  RecruiterRecord,
  ApprovalStatus,
} from "@/lib/types";

interface Payload {
  recruiter: RecruiterRecord;
  jobs: JobItem[];
  applications: ApplicationItem[];
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-dark">{value}</p>
      </div>
    </div>
  );
}

export default function AdminRecruiterDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"applicants" | "jobs">("applicants");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  console.log("data", data);

  function load() {
    setLoading(true);
    api<Payload>(`/api/admin/recruiters/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function setStatus(approvalStatus: ApprovalStatus) {
    if (
      approvalStatus !== "approved" &&
      !confirm(
        "Revoke access? Their job postings will be hidden from the website."
      )
    )
      return;
    setBusy(true);
    try {
      await api(`/api/admin/recruiters/${id}`, {
        method: "PUT",
        body: JSON.stringify({ approvalStatus }),
      });
      load();
    } catch {
      alert("Could not update this recruiter.");
    } finally {
      setBusy(false);
    }
  }

  const applicants = useMemo(() => {
    const q = query.toLowerCase();
    if (!data) return [];
    if (!q) return data.applications;
    return data.applications.filter((a) => {
      const u = a.user;
      return (
        `${u?.firstName} ${u?.lastName}`.toLowerCase().includes(q) ||
        (u?.email ?? "").toLowerCase().includes(q) ||
        (a.job?.title ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, query]);

  if (loading)
    return (
      <div className="space-y-6">
        <SkeletonProfile />
        <SkeletonList rows={3} />
      </div>
    );

  if (!data) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <Building2 className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-4 font-heading text-lg font-semibold text-dark">
          Recruiter not found
        </p>
        <Link
          href="/admin/recruiters"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Back to recruiters
        </Link>
      </div>
    );
  }

  const r = data.recruiter;
  const status = (r.approvalStatus ?? "pending") as ApprovalStatus;

  return (
    <div>
      <Link
        href="/admin/recruiters"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to recruiters
      </Link>

      {/* Recruiter header */}
      <div className="mt-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
              <Building2 className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-bold text-dark">
                {r.companyName || "—"}
              </h1>
              <p className="text-sm text-slate-500">
                {r.firstName} {r.lastName}
                {r.designation ? ` · ${r.designation}` : ""}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Registered {formatDate(r.createdAt)}
                {r.approvedAt ? ` · Approved ${formatDate(r.approvedAt)}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                status === "approved"
                  ? "bg-success/10 text-success"
                  : status === "rejected"
                  ? "bg-danger/10 text-danger"
                  : "bg-warning/10 text-warning"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              {status === "approved"
                ? "Approved"
                : status === "rejected"
                ? "Rejected"
                : "Pending approval"}
            </span>
            {status !== "approved" && (
              <button
                disabled={busy}
                onClick={() => setStatus("approved")}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-success px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                <Check className="h-4 w-4" /> Approve
              </button>
            )}
            {status !== "rejected" && (
              <button
                disabled={busy}
                onClick={() => setStatus("rejected")}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:border-danger/40 hover:text-danger disabled:opacity-60"
              >
                <X className="h-4 w-4" />{" "}
                {status === "approved" ? "Revoke" : "Reject"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <Meta icon={Mail} label="Email" value={r.email} />
          <Meta icon={Phone} label="Phone" value={r.phone} />
          <Meta icon={MapPin} label="Location" value={r.companyLocation} />
          <Meta icon={Globe} label="Website" value={r.companyWebsite} />
          <Meta icon={Briefcase} label="Industry" value={r.industry} />
          <Meta icon={Users} label="Company Size" value={r.companySize} />
        </div>

        {r.companyAbout && (
          <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600">
            {r.companyAbout}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 rounded-lg border border-slate-200 bg-white p-1 sm:w-fit">
          <button
            onClick={() => setTab("applicants")}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium sm:flex-none ${
              tab === "applicants"
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-light"
            }`}
          >
            Applied students ({data.applications.length})
          </button>
          <button
            onClick={() => setTab("jobs")}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium sm:flex-none ${
              tab === "jobs"
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-light"
            }`}
          >
            Jobs posted ({data.jobs.length})
          </button>
        </div>

        {tab === "applicants" && (
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search student or job"
              className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        )}
      </div>

      {/* Applicants */}
      {tab === "applicants" && (
        <div className="mt-5 space-y-3">
          {applicants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 font-heading text-lg font-semibold text-dark">
                No students have applied yet
              </p>
            </div>
          ) : (
            applicants.map((a) => {
              const u = a.user as any;
              const resume = a.resumeUrl || u?.resumeUrl;
              return (
                <div
                  key={a._id}
                  className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-light font-heading font-semibold text-primary">
                        {(u?.firstName?.[0] ?? "?").toUpperCase()}
                      </span>
                      <div>
                        <p className="font-heading font-semibold text-dark">
                          {u
                            ? `${u.firstName} ${u.lastName}`
                            : "Unknown student"}
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
                          {(u?.college || u?.schoolName) && (
                            <span className="inline-flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />{" "}
                              {u.college || u.schoolName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
                    <span className="text-slate-500">
                      Applied for:{" "}
                      <span className="font-medium text-dark">
                        {a.job?.title ?? "—"}
                      </span>
                    </span>
                    <span className="text-slate-400">
                      {formatDate(a.createdAt)}
                    </span>
                    {resume && (
                      <a
                        href={resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" /> Resume
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Jobs */}
      {tab === "jobs" && (
        <div className="mt-5 space-y-3">
          {data.jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 font-heading text-lg font-semibold text-dark">
                No jobs posted by this recruiter
              </p>
            </div>
          ) : (
            data.jobs.map((job) => {
              const count = data.applications.filter(
                (a) => (a.job as any)?._id === job._id
              ).length;
              return (
                <div
                  key={job._id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
                      <Briefcase className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-heading font-semibold text-dark">
                          {job.title}
                        </p>
                        {job.active ? (
                          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                            Live
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {job.location}
                        </span>
                        <span>{job.type}</span>
                        {job.salary && <span>{job.salary}</span>}
                        <span>Posted {formatDate(job.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-dark">{count}</span>{" "}
                    applicants
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
