"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Clock, Building2 } from "lucide-react";
import { jobs as fallbackJobs } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client";
import type { JobItem } from "@/lib/types";

export function LatestJobs() {
  const [jobs, setJobs] = useState<JobItem[] | null>(null);

  useEffect(() => {
    api<JobItem[]>("/api/jobs")
      .then((data) => setJobs(data.slice(0, 4)))
      .catch(() => setJobs([]));
  }, []);

  // Show DB jobs when available; otherwise fall back to sample content.
  const useLive = jobs && jobs.length > 0;

  return (
    <section className="bg-light py-14">
      <div className="container-page">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="h3 text-dark">Latest Job Opportunities</h2>
          <Link href="/jobs" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          {(useLive ? jobs! : []).map((job) => (
            <div
              key={job._id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-heading font-semibold text-dark">{job.title}</p>
                  <p className="text-sm text-slate-500">{job.company}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-500 sm:justify-end">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {job.type}
                </span>
                <Button variant="outline" size="sm" href={`/jobs/${job._id}`}>
                  View & Apply
                </Button>
              </div>
            </div>
          ))}

          {!useLive &&
            fallbackJobs.map((job) => (
              <div
                key={job.title}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-heading font-semibold text-dark">{job.title}</p>
                    <p className="text-sm text-slate-500">{job.company}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-500 sm:justify-end">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {job.type}
                  </span>
                  <span className="text-slate-400">{job.posted}</span>
                  <Button variant="outline" size="sm" href="/jobs">
                    Apply Now
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
