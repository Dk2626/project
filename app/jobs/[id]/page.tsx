"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MapPin,
  Clock,
  Building2,
  IndianRupee,
  Briefcase,
  ArrowLeft,
  BadgeCheck,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ApplyButton } from "@/components/ApplyButton";
import { api, ApiError } from "@/lib/client";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/AuthProvider";
import type { JobItem, ApplicationItem } from "@/lib/types";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<JobItem | null>(null);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api<JobItem>(`/api/jobs/${id}`)
      .then(setJob)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    api<ApplicationItem[]>("/api/applications?kind=job")
      .then((apps) => setApplied(apps.some((a) => a.job?._id === id)))
      .catch(() => {});
  }, [user, id]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-light">
        <div className="container-page py-8">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to jobs
          </Link>

          {loading ? (
            <div className="mt-6 space-y-4 rounded-2xl border border-slate-100 bg-white p-6">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <SkeletonText lines={6} />
            </div>
          ) : notFound || !job ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 font-heading text-lg font-semibold text-dark">
                This job isn&apos;t available
              </p>
              <p className="mt-1 text-sm text-slate-500">
                It may have been closed or removed.
              </p>
              <Link
                href="/jobs"
                className="mt-5 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover"
              >
                Browse other jobs
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex items-start gap-4">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
                      <Building2 className="h-7 w-7" />
                    </span>
                    <div>
                      <h1 className="font-heading text-2xl font-bold text-dark">{job.title}</h1>
                      <p className="mt-1 text-slate-500">{job.company}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Tag icon={<MapPin className="h-3.5 w-3.5" />}>{job.location}</Tag>
                    <Tag icon={<Clock className="h-3.5 w-3.5" />}>{job.type}</Tag>
                    {job.experience && (
                      <Tag icon={<BadgeCheck className="h-3.5 w-3.5" />}>{job.experience}</Tag>
                    )}
                    {job.salary && (
                      <Tag icon={<IndianRupee className="h-3.5 w-3.5" />}>{job.salary}</Tag>
                    )}
                  </div>

                  {job.description && (
                    <div className="mt-6">
                      <h2 className="font-heading text-lg font-semibold text-dark">
                        About the role
                      </h2>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                        {job.description}
                      </p>
                    </div>
                  )}

                  {job.skills && job.skills.length > 0 && (
                    <div className="mt-6">
                      <h2 className="font-heading text-lg font-semibold text-dark">
                        Skills
                      </h2>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {job.skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Apply card */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <p className="font-heading text-lg font-semibold text-dark">
                    Interested in this role?
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {user
                      ? "Apply with the resume on your profile."
                      : "You'll need to log in before applying."}
                  </p>
                  <div className="mt-5">
                    <ApplyButton
                      kind="job"
                      targetId={job._id}
                      alreadyApplied={applied}
                      size="md"
                      className="w-full"
                    />
                  </div>
                  {user && (
                    <p className="mt-3 text-center text-xs text-slate-400">
                      Track status in your{" "}
                      <Link href="/dashboard" className="text-primary hover:underline">
                        dashboard
                      </Link>
                      .
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Tag({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-light px-3 py-1 text-xs font-medium text-slate-600">
      {icon}
      {children}
    </span>
  );
}
