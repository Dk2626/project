"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  Star,
  Linkedin,
  Github,
  Pencil,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/client";
import { useAuth } from "@/components/AuthProvider";
import { usePaginatedList } from "@/lib/usePaginatedList";
import { Pagination } from "@/components/ui/Pagination";
import { SkeletonRecordList } from "@/components/ui/Skeleton";
import { StudentEditModal } from "@/components/StudentEditModal";
import { ResumeUpload } from "@/components/ResumeUpload";
import type { StudentRecord } from "@/lib/types";

type Filter = "all" | "College Student" | "School Student";

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

/** One key/value cell in the student meta grid. */
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

export default function AdminStudentsPage() {
  const { user } = useAuth();
  const isSuper = user?.role === "superadmin";

  const [filter, setFilter] = useState<Filter>("all");

  // Searching, filtering and paging all happen server-side, so the browser
  // only ever holds one page of students in memory.
  const list = usePaginatedList<StudentRecord>({
    path: "/api/admin/students",
    params: { type: filter === "all" ? undefined : filter },
  });

  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function onSaved(updated: StudentRecord) {
    list.patchItem((s) => s._id === updated._id, updated);
    setEditing((current) =>
      current && current._id === updated._id ? updated : current
    );
  }

  async function removeStudent(s: StudentRecord) {
    if (
      !confirm(
        `Delete ${s.firstName} ${s.lastName}? Their applications and CV will be removed too. This cannot be undone.`
      )
    )
      return;

    setBusyId(s._id);
    try {
      await api(`/api/admin/students/${s._id}`, { method: "DELETE" });
      list.removeItem((x) => x._id === s._id);
      list.reload();
    } catch (e: any) {
      alert(e?.message ?? "Could not delete this student.");
    } finally {
      setBusyId(null);
    }
  }

  const tabs: { key: Filter; label: string; count?: number }[] = [
    { key: "all", label: "All", count: list.counts.all },
    { key: "College Student", label: "College", count: list.counts.college },
    { key: "School Student", label: "School", count: list.counts.school },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-dark">Students</h1>
      <p className="mt-1 text-sm text-slate-500">
        Every student who has registered on the platform, with their
        registration details.
        {isSuper && " As a superadmin you can also edit and manage them."}
      </p>

      {/* Tabs + search */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 rounded-lg border border-slate-200 bg-white p-1 sm:w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium sm:flex-none ${
                filter === t.key
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:bg-light"
              }`}
            >
              {t.label}
              {t.count !== undefined && ` (${t.count})`}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={list.query}
            onChange={(e) => list.setQuery(e.target.value)}
            placeholder="Search name, email, phone or institution"
            className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="mt-5">
        {list.loading ? (
          <SkeletonRecordList rows={4} />
        ) : list.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 font-heading text-lg font-semibold text-dark">
              {list.query ? "No students match that search" : "No students yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {list.query
                ? "Try a different name, email or institution."
                : "Registered students will appear here."}
            </p>
          </div>
        ) : (
          <div
            className={`space-y-3 transition-opacity ${
              list.fetching ? "opacity-60" : ""
            }`}
          >
            {list.items.map((s) => {
              const isSchool = s.studentType === "School Student";
              return (
                <div
                  key={s._id}
                  className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  {/* Header */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-light font-heading font-semibold text-primary">
                        {(s.firstName?.[0] ?? "?").toUpperCase()}
                      </span>
                      <div>
                        <p className="font-heading font-semibold text-dark">
                          {s.firstName} {s.lastName}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          {s.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {s.email}
                            </span>
                          )}
                          {s.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {s.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                          isSchool
                            ? "bg-warning/10 text-warning"
                            : "bg-primary-light text-primary"
                        }`}
                      >
                        {isSchool ? (
                          <BookOpen className="h-3 w-3" />
                        ) : (
                          <GraduationCap className="h-3 w-3" />
                        )}
                        {isSchool ? "School" : "College"}
                      </span>

                      {isSuper && (
                        <>
                          <button
                            onClick={() => setEditing(s)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:border-primary/40 hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            disabled={busyId === s._id}
                            onClick={() => removeStudent(s)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:border-danger/40 hover:text-danger disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Education details */}
                  <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-4">
                    {isSchool ? (
                      <>
                        <Meta
                          icon={Building2}
                          label="School"
                          value={s.schoolName}
                        />
                        <Meta
                          icon={GraduationCap}
                          label="Class"
                          value={s.classGrade}
                        />
                        <Meta icon={BookOpen} label="Board" value={s.board} />
                        <Meta
                          icon={BookOpen}
                          label="Stream"
                          value={s.schoolStream}
                        />
                        <Meta
                          icon={Calendar}
                          label="Completion Year"
                          value={s.graduationYear}
                        />
                        <Meta
                          icon={Star}
                          label="Percentage / Grade"
                          value={s.cgpa}
                        />
                      </>
                    ) : (
                      <>
                        <Meta
                          icon={Building2}
                          label="College"
                          value={s.college}
                        />
                        <Meta
                          icon={GraduationCap}
                          label="Degree"
                          value={s.degree}
                        />
                        <Meta
                          icon={BookOpen}
                          label="Department"
                          value={s.department}
                        />
                        <Meta
                          icon={Calendar}
                          label="Current Year"
                          value={s.currentYear}
                        />
                        <Meta
                          icon={Calendar}
                          label="Graduation Year"
                          value={s.graduationYear}
                        />
                        <Meta icon={Star} label="CGPA / %" value={s.cgpa} />
                      </>
                    )}
                  </div>

                  {/* CV + links + registered date */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-slate-100 pt-4 text-sm">
                    <span className="text-slate-400">
                      Registered {formatDate(s.createdAt)}
                    </span>

                    {/* Any admin can manage a student's CV. */}
                    <ResumeUpload
                      compact
                      endpoint={`/api/admin/students/${s._id}/resume`}
                      resumeUrl={s.resumeUrl}
                      onUpdated={onSaved}
                    />

                    {s.linkedin && (
                      <a
                        href={s.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                      >
                        <Linkedin className="h-4 w-4" /> LinkedIn
                      </a>
                    )}
                    {s.github && (
                      <a
                        href={s.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                      >
                        <Github className="h-4 w-4" /> GitHub
                      </a>
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
          label="students"
        />
      </div>

      <StudentEditModal
        student={editing}
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSaved={onSaved}
      />
    </div>
  );
}
