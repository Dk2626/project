"use client";

import { useState } from "react";
import { Users, FileText, Search, Mail, Phone, GraduationCap, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/client";
import { usePaginatedList } from "@/lib/usePaginatedList";
import { Pagination } from "@/components/ui/Pagination";
import { SkeletonList } from "@/components/ui/Skeleton";
import type { ApplicationItem } from "@/lib/types";

const JOB_STATUSES = ["Applied", "Under Review", "Shortlisted", "Interview", "Rejected", "Accepted"];
const WEBINAR_STATUSES = ["Registered", "Confirmed", "Attended", "Cancelled"];

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminApplicationsPage() {
  const [tab, setTab] = useState<"job" | "webinar">("job");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const list = usePaginatedList<ApplicationItem>({
    path: "/api/applications",
    params: { kind: tab },
  });

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    // Optimistic — the select already shows the new value.
    list.patchItem((a) => a._id === id, { status });
    try {
      await api(`/api/applications/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    } catch {
      alert("Could not update status.");
      list.reload();
    } finally {
      setUpdatingId(null);
    }
  }

  const jobCount = list.counts.job;
  const webinarCount = list.counts.webinar;
  const statuses = tab === "job" ? JOB_STATUSES : WEBINAR_STATUSES;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-dark">Applications</h1>
      <p className="mt-1 text-sm text-slate-500">
        Every student who applied for a job or registered for a webinar.
      </p>

      {/* Tabs + search */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 rounded-lg border border-slate-200 bg-white p-1 sm:w-fit">
          <button
            onClick={() => setTab("job")}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium sm:flex-none ${
              tab === "job" ? "bg-primary text-white" : "text-slate-600 hover:bg-light"
            }`}
          >
            Job applicants{jobCount !== undefined && ` (${jobCount})`}
          </button>
          <button
            onClick={() => setTab("webinar")}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium sm:flex-none ${
              tab === "webinar" ? "bg-primary text-white" : "text-slate-600 hover:bg-light"
            }`}
          >
            Webinar registrants{webinarCount !== undefined && ` (${webinarCount})`}
          </button>
        </div>

        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={list.query}
            onChange={(e) => list.setQuery(e.target.value)}
            placeholder="Search name, email or title"
            className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="mt-5">
        {list.loading ? (
          <SkeletonList rows={5} />
        ) : list.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 font-heading text-lg font-semibold text-dark">
              No {tab === "job" ? "applicants" : "registrants"} yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              They&apos;ll appear here as students apply.
            </p>
          </div>
        ) : (
          <div
            className={`space-y-3 transition-opacity ${
              list.fetching ? "opacity-60" : ""
            }`}
          >
            {list.items.map((a) => {
              const u = a.user;
            const target = tab === "job" ? a.job : a.webinar;
            const resume = a.resumeUrl || u?.resumeUrl;
            return (
              <div
                key={a._id}
                className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Student */}
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
                        {u?.college && (
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" /> {u.college}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status control */}
                  <div className="flex items-center gap-3">
                    <StatusBadge status={a.status} />
                    <select
                      value={a.status}
                      disabled={updatingId === a._id}
                      onChange={(e) => updateStatus(a._id, e.target.value)}
                      className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Application meta */}
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-500">
                    {tab === "job" ? "Applied for" : "Registered for"}:{" "}
                    <span className="font-medium text-dark">{target?.title ?? "—"}</span>
                    {tab === "job" && (a.job as any)?.company && (
                      <span className="text-slate-400"> · {(a.job as any).company}</span>
                    )}
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
                </div>
              </div>
              );
            })}
          </div>
        )}

        <Pagination
          page={list.page}
          pages={list.pages}
          total={list.total}
          limit={list.limit}
          onPageChange={list.setPage}
          onLimitChange={list.setLimit}
          busy={list.fetching}
          label={tab === "job" ? "applications" : "registrations"}
        />
      </div>
    </div>
  );
}
