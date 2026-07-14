"use client";

import { useEffect, useMemo, useState } from "react";
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
  FileText,
  ExternalLink,
  Linkedin,
  Github,
} from "lucide-react";
import { api } from "@/lib/client";
import type { StudentRecord } from "@/lib/types";

type Filter = "all" | "College Student" | "School Student";

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** One key/value cell in the student meta grid. */
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

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    setLoading(true);
    api<StudentRecord[]>("/api/admin/students")
      .then(setStudents)
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const collegeCount = students.filter((s) => s.studentType !== "School Student").length;
  const schoolCount = students.filter((s) => s.studentType === "School Student").length;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return students
      .filter((s) => {
        if (filter === "all") return true;
        if (filter === "School Student") return s.studentType === "School Student";
        return s.studentType !== "School Student";
      })
      .filter((s) => {
        if (!q) return true;
        return (
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          (s.email ?? "").toLowerCase().includes(q) ||
          (s.phone ?? "").toLowerCase().includes(q) ||
          (s.college ?? "").toLowerCase().includes(q) ||
          (s.schoolName ?? "").toLowerCase().includes(q)
        );
      });
  }, [students, query, filter]);

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: students.length },
    { key: "College Student", label: "College", count: collegeCount },
    { key: "School Student", label: "School", count: schoolCount },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-dark">Students</h1>
      <p className="mt-1 text-sm text-slate-500">
        Every student who has registered on the platform, with their registration details.
      </p>

      {/* Tabs + search */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 rounded-lg border border-slate-200 bg-white p-1 sm:w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium sm:flex-none ${
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
            placeholder="Search name, email, phone or institution"
            className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          [0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-white" />)
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 font-heading text-lg font-semibold text-dark">
              No students yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Registered students will appear here.
            </p>
          </div>
        ) : (
          filtered.map((s) => {
            const isSchool = s.studentType === "School Student";
            return (
              <div key={s._id} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
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

                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      isSchool
                        ? "bg-warning/10 text-warning"
                        : "bg-primary-light text-primary"
                    }`}
                  >
                    {isSchool ? <BookOpen className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
                    {isSchool ? "School" : "College"}
                  </span>
                </div>

                {/* Education details */}
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-4">
                  {isSchool ? (
                    <>
                      <Meta icon={Building2} label="School" value={s.schoolName} />
                      <Meta icon={GraduationCap} label="Class" value={s.classGrade} />
                      <Meta icon={BookOpen} label="Board" value={s.board} />
                      <Meta icon={BookOpen} label="Stream" value={s.schoolStream} />
                      <Meta icon={Calendar} label="Completion Year" value={s.graduationYear} />
                      <Meta icon={Star} label="Percentage / Grade" value={s.cgpa} />
                    </>
                  ) : (
                    <>
                      <Meta icon={Building2} label="College" value={s.college} />
                      <Meta icon={GraduationCap} label="Degree" value={s.degree} />
                      <Meta icon={BookOpen} label="Department" value={s.department} />
                      <Meta icon={Calendar} label="Current Year" value={s.currentYear} />
                      <Meta icon={Calendar} label="Graduation Year" value={s.graduationYear} />
                      <Meta icon={Star} label="CGPA / %" value={s.cgpa} />
                    </>
                  )}
                </div>

                {/* Links + registered date */}
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-400">Registered {formatDate(s.createdAt)}</span>
                  {s.resumeUrl && (
                    <a
                      href={s.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" /> Resume
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
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
          })
        )}
      </div>
    </div>
  );
}
