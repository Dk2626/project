"use client";

import Link from "next/link";
import { Clock, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ApprovalStatus } from "@/lib/types";

/**
 * Shown to a recruiter whose account hasn't been approved yet. Every
 * recruiter-only feature (posting jobs, viewing applicants) renders this
 * instead of the real UI until an admin grants access.
 */
export function ApprovalNotice({
  status,
  reason,
}: {
  status: ApprovalStatus;
  reason?: string;
}) {
  if (status === "approved") return null;

  const rejected = status === "rejected";

  return (
    <div
      className={`rounded-xl border p-8 text-center ${
        rejected ? "border-danger/30 bg-danger/5" : "border-warning/30 bg-warning/5"
      }`}
    >
      <span
        className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${
          rejected ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"
        }`}
      >
        {rejected ? <ShieldAlert className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
      </span>

      <h2 className="mt-5 font-heading text-xl font-bold text-dark">
        {rejected ? "Access not approved" : "Admin access needed"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        {rejected ? (
          <>
            Your recruiter account was not approved by the admin team
            {reason ? `: ${reason}` : "."} Please get in touch if you think this is a mistake.
          </>
        ) : (
          <>
            Your recruiter account has been registered and is waiting for admin approval. Once an
            admin approves your access you&apos;ll be able to post jobs and see the students who
            apply to them.
          </>
        )}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/contact"
          className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Contact admin
        </Link>
        <Link
          href="/jobs"
          className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-5 text-sm font-medium text-dark hover:bg-light"
        >
          Browse the job board
        </Link>
      </div>

      {!rejected && (
        <p className="mt-6 inline-flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Verification usually takes less than one working day.
        </p>
      )}
    </div>
  );
}
