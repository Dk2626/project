"use client";

import { useRef, useState } from "react";
import {
  FileText,
  Upload,
  ExternalLink,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/client";
import type { StudentRecord } from "@/lib/types";

/**
 * Upload / replace / remove a CV.
 *
 * Used in two places against two endpoints:
 *   - the student's own dashboard  → /api/profile/resume
 *   - the admin dashboard          → /api/admin/students/<id>/resume
 *
 * Both endpoints delete the previous object from the S3 bucket once the new
 * one is safely stored, so replacing a CV never leaves an orphaned file
 * behind.
 */
export function ResumeUpload({
  endpoint,
  resumeUrl,
  onUpdated,
  compact = false,
}: {
  endpoint: string;
  resumeUrl?: string;
  onUpdated?: (record: StudentRecord) => void;
  /** Inline, single-row layout for use inside a list of records. */
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "delete" | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const MAX_MB = 5;

  async function upload(file: File) {
    setError("");
    setDone("");

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Only PDF files are allowed.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`That file is over ${MAX_MB}MB.`);
      return;
    }

    const fd = new FormData();
    fd.append("resume", file);

    setBusy("upload");
    try {
      const updated = await api<StudentRecord & { oldResumeRemoved?: boolean }>(
        endpoint,
        { method: "POST", body: fd }
      );
      onUpdated?.(updated);
      setDone(
        updated.oldResumeRemoved
          ? "CV updated — the previous file was removed."
          : "CV uploaded."
      );
    } catch (e: any) {
      setError(e?.message ?? "Could not upload that file.");
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    if (!confirm("Remove this CV? The file will be deleted permanently.")) return;
    setError("");
    setDone("");
    setBusy("delete");
    try {
      const updated = await api<StudentRecord>(endpoint, { method: "DELETE" });
      onUpdated?.(updated);
      setDone("CV removed.");
    } catch (e: any) {
      setError(e?.message ?? "Could not remove the CV.");
    } finally {
      setBusy(null);
    }
  }

  const uploading = busy === "upload";

  const picker = (
    <input
      ref={inputRef}
      type="file"
      accept="application/pdf,.pdf"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) upload(file);
      }}
    />
  );

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {picker}
        {resumeUrl && (
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <FileText className="h-4 w-4" /> CV
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-primary/40 hover:text-primary disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {uploading ? "Uploading…" : resumeUrl ? "Replace CV" : "Upload CV"}
        </button>
        {resumeUrl && (
          <button
            onClick={remove}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-danger disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        )}
        {error && <span className="text-xs text-danger">{error}</span>}
        {done && !error && (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> {done}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      {picker}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-dark">Curriculum Vitae</p>
            {resumeUrl ? (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                View current CV <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="mt-0.5 text-xs text-slate-400">
                No CV uploaded yet.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy !== null}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading…" : resumeUrl ? "Replace" : "Upload"}
          </button>
          {resumeUrl && (
            <button
              onClick={remove}
              disabled={busy !== null}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:border-danger/40 hover:text-danger disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        PDF only, up to {MAX_MB}MB. Uploading a new file replaces the old one
        and deletes it from storage.
      </p>

      {error && (
        <p className="mt-2 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}
      {done && !error && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-success/10 px-3 py-2 text-xs text-success">
          <CheckCircle2 className="h-3.5 w-3.5" /> {done}
        </p>
      )}
    </div>
  );
}
