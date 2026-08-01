"use client";

import { useState } from "react";
import {
  MessageSquare,
  Search,
  Mail,
  Phone,
  Building2,
  Clock,
  User as UserIcon,
  Trash2,
  Send,
  StickyNote,
  FileText,
} from "lucide-react";
import { api } from "@/lib/client";
import { useAuth } from "@/components/AuthProvider";
import { usePaginatedList } from "@/lib/usePaginatedList";
import { Pagination } from "@/components/ui/Pagination";
import { SkeletonList } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import type { ConsultationRecord, ConsultationStatus } from "@/lib/types";

const STATUSES: ConsultationStatus[] = [
  "New",
  "In Progress",
  "Responded",
  "Closed",
];

type Tab = "all" | ConsultationStatus;

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

/** One consultation card, with its own reply / note editor. */
function ConsultationCard({
  item,
  isSuper,
  onPatched,
  onDeleted,
}: {
  item: ConsultationRecord;
  isSuper: boolean;
  onPatched: (updated: ConsultationRecord) => void;
  onDeleted: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState(item.response ?? "");
  const [note, setNote] = useState(item.internalNote ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function patch(body: Record<string, any>) {
    setBusy(true);
    setError("");
    try {
      const updated = await api<ConsultationRecord>(
        `/api/admin/consultations/${item._id}`,
        { method: "PATCH", body: JSON.stringify(body) }
      );
      onPatched(updated);
      return true;
    } catch (e: any) {
      setError(e?.message ?? "Could not save. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveReply() {
    // Writing a reply moves the request to "Responded" unless it's already
    // been closed — no point making the admin change two things.
    const body: Record<string, any> = { response, internalNote: note };
    if (response.trim() && item.status !== "Closed") body.status = "Responded";
    if (await patch(body)) setOpen(false);
  }

  async function remove() {
    if (
      !confirm(
        `Delete the request from ${item.name}? This cannot be undone.`
      )
    )
      return;
    setBusy(true);
    try {
      await api(`/api/admin/consultations/${item._id}`, { method: "DELETE" });
      onDeleted(item._id);
    } catch (e: any) {
      setError(e?.message ?? "Could not delete this request.");
      setBusy(false);
    }
  }

  const student = typeof item.user === "object" ? item.user : null;

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-light font-heading font-semibold text-primary">
            {(item.name?.[0] ?? "?").toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="font-heading font-semibold text-dark">
              {item.name}
              {student && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                  <UserIcon className="h-3 w-3" /> Registered student
                </span>
              )}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <a
                href={`mailto:${item.email}`}
                className="inline-flex items-center gap-1 hover:text-primary"
              >
                <Mail className="h-3 w-3" /> {item.email}
              </a>
              {item.phone && (
                <a
                  href={`tel:${item.phone}`}
                  className="inline-flex items-center gap-1 hover:text-primary"
                >
                  <Phone className="h-3 w-3" /> {item.phone}
                </a>
              )}
              {item.institution && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {item.institution}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatDate(item.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status} />
          <select
            value={item.status}
            disabled={busy}
            onChange={(e) => patch({ status: e.target.value })}
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {isSuper && (
            <button
              onClick={remove}
              disabled={busy}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:border-danger/40 hover:text-danger disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* The request itself */}
      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
          <span>
            <span className="text-slate-400">Topic:</span>{" "}
            <span className="font-medium text-dark">{item.topic}</span>
          </span>
          <span>
            <span className="text-slate-400">Type:</span>{" "}
            <span className="font-medium text-dark">{item.studentType}</span>
          </span>
          <span>
            <span className="text-slate-400">Prefers:</span>{" "}
            <span className="font-medium text-dark">{item.preferredMode}</span>
          </span>
          {item.preferredTime && (
            <span>
              <span className="text-slate-400">Best time:</span>{" "}
              <span className="font-medium text-dark">{item.preferredTime}</span>
            </span>
          )}
          {student?.resumeUrl && (
            <a
              href={student.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              <FileText className="h-3.5 w-3.5" /> View CV
            </a>
          )}
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
          {item.message}
        </p>
      </div>

      {/* Existing reply / note */}
      {(item.response || item.internalNote) && !open && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          {item.response && (
            <div className="rounded-lg bg-primary-light/60 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Reply sent to student
                {item.respondedAt && ` · ${formatDate(item.respondedAt)}`}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-dark">
                {item.response}
              </p>
            </div>
          )}
          {item.internalNote && (
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <StickyNote className="h-3 w-3" /> Internal note
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">
                {item.internalNote}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reply editor */}
      <div className="mt-4 border-t border-slate-100 pt-4">
        {open ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Reply to the student
                <span className="ml-2 text-xs font-normal text-slate-400">
                  visible on their consultation page
                </span>
              </label>
              <textarea
                rows={4}
                maxLength={4000}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Write what you'd like the student to see…"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Internal note
                <span className="ml-2 text-xs font-normal text-slate-400">
                  admin only — the student never sees this
                </span>
              </label>
              <textarea
                rows={2}
                maxLength={2000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Context for the team…"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={saveReply}
                disabled={busy}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              >
                <Send className="h-4 w-4" /> {busy ? "Saving…" : "Save reply"}
              </button>
              <button
                onClick={() => {
                  setResponse(item.response ?? "");
                  setNote(item.internalNote ?? "");
                  setError("");
                  setOpen(false);
                }}
                disabled={busy}
                className="inline-flex h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-light disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:border-primary/40 hover:text-primary"
            >
              <Send className="h-3.5 w-3.5" />
              {item.response ? "Edit reply" : "Reply"}
            </button>
            <a
              href={`mailto:${item.email}?subject=${encodeURIComponent(
                `Your URAV consultation request — ${item.topic}`
              )}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:border-primary/40 hover:text-primary"
            >
              <Mail className="h-3.5 w-3.5" /> Email directly
            </a>
            {item.handledBy && typeof item.handledBy === "object" && (
              <span className="text-xs text-slate-400">
                Last handled by {item.handledBy.firstName}{" "}
                {item.handledBy.lastName}
              </span>
            )}
            {error && <span className="text-sm text-danger">{error}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminConsultationsPage() {
  const { user } = useAuth();
  const isSuper = user?.role === "superadmin";

  const [tab, setTab] = useState<Tab>("all");

  const list = usePaginatedList<ConsultationRecord>({
    path: "/api/admin/consultations",
    params: { status: tab === "all" ? undefined : tab },
  });

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: list.counts.all },
    ...STATUSES.map((s) => ({
      key: s as Tab,
      label: s,
      count: list.counts[s],
    })),
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-dark">Consultations</h1>
      <p className="mt-1 text-sm text-slate-500">
        Consultation requests sent by students through the website. Reply here
        and the student sees it on their consultation page.
        {isSuper && " As a superadmin you can also delete requests."}
      </p>

      {/* Tabs + search */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-1 lg:w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium ${
                tab === t.key
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:bg-light"
              }`}
            >
              {t.label}
              {t.count !== undefined && ` (${t.count})`}
            </button>
          ))}
        </div>

        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={list.query}
            onChange={(e) => list.setQuery(e.target.value)}
            placeholder="Search name, email, institution or message"
            className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="mt-5">
        {list.loading ? (
          <SkeletonList rows={3} />
        ) : list.error ? (
          <div className="rounded-xl border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
            {list.error}
          </div>
        ) : list.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 font-heading text-lg font-semibold text-dark">
              {list.query
                ? "No requests match that search"
                : "No consultation requests yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {list.query
                ? "Try a different name, email or keyword."
                : "Requests sent from the consultation page will appear here."}
            </p>
          </div>
        ) : (
          <div
            className={`space-y-3 transition-opacity ${
              list.fetching ? "opacity-60" : ""
            }`}
          >
            {list.items.map((item) => (
              <ConsultationCard
                key={item._id}
                item={item}
                isSuper={isSuper}
                onPatched={(updated) =>
                  list.patchItem((c) => c._id === updated._id, updated)
                }
                onDeleted={(id) => {
                  list.removeItem((c) => c._id === id);
                  list.reload();
                }}
              />
            ))}
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
          label="requests"
        />
      </div>
    </div>
  );
}
