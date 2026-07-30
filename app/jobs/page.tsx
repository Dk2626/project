"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Clock, Building2, Search, Briefcase, IndianRupee } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ApplyButton } from "@/components/ApplyButton";
import { api } from "@/lib/client";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/AuthProvider";
import type { JobItem, ApplicationItem } from "@/lib/types";

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  useEffect(() => {
    api<JobItem[]>("/api/jobs")
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      setAppliedIds(new Set());
      return;
    }
    api<ApplicationItem[]>("/api/applications?kind=job")
      .then((apps) =>
        setAppliedIds(new Set(apps.map((a) => a.job?._id).filter(Boolean) as string[]))
      )
      .catch(() => {});
  }, [user]);

  const types = useMemo(
    () => ["All", ...Array.from(new Set(jobs.map((j) => j.type)))],
    [jobs]
  );

  const filtered = jobs.filter((j) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q);
    const matchesType = typeFilter === "All" || j.type === typeFilter;
    return matchesQuery && matchesType;
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-light">
        {/* Header */}
        <section className="bg-gradient-to-b from-primary-light/60 to-light">
          <div className="container-page py-12 md:py-16">
            <h1 className="h1 text-dark">Job Opportunities</h1>
            <p className="mt-3 max-w-xl text-slate-600">
              Browse open roles from our partner companies and apply in one click.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title, company or location"
                  className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {types.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="container-page py-10">
          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i}>
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                </SkeletonCard>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 font-heading text-lg font-semibold text-dark">
                No jobs match your search
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try a different keyword or clear the filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((job) => (
                <article
                  key={job._id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <Link
                        href={`/jobs/${job._id}`}
                        className="font-heading font-semibold text-dark hover:text-primary"
                      >
                        {job.title}
                      </Link>
                      <p className="text-sm text-slate-500">{job.company}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {job.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {job.type}
                        </span>
                        {job.salary && (
                          <span className="inline-flex items-center gap-1">
                            <IndianRupee className="h-3.5 w-3.5" /> {job.salary}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                    <Link
                      href={`/jobs/${job._id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View details
                    </Link>
                    <ApplyButton
                      kind="job"
                      targetId={job._id}
                      alreadyApplied={appliedIds.has(job._id)}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
