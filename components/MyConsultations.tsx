"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Clock, MessagesSquare } from "lucide-react";
import { api } from "@/lib/client";
import { useAuth } from "@/components/AuthProvider";
import { StatusBadge } from "@/components/StatusBadge";
import { SkeletonList } from "@/components/ui/Skeleton";
import type { ConsultationRecord } from "@/lib/types";

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

/**
 * The signed-in student's own consultation requests, with the team's reply
 * once one has been written. Hidden entirely for logged-out visitors.
 *
 * `refreshKey` is bumped by the page after a new request is submitted so the
 * list picks it up without a page reload.
 */
export function MyConsultations({ refreshKey = 0 }: { refreshKey?: number }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ConsultationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!user || user.role !== "student") {
      setLoading(false);
      return;
    }
    api<ConsultationRecord[]>("/api/consultations")
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load, refreshKey]);

  if (authLoading || !user || user.role !== "student") return null;

  return (
    <div>
      <h2 className="h3 text-dark">My requests</h2>
      <p className="mt-2 text-sm text-slate-600">
        Every consultation you&apos;ve asked for, and what the team said back.
      </p>

      <div className="mt-6">
        {loading ? (
          <SkeletonList rows={2} />
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <MessageSquare className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 font-heading font-semibold text-dark">
              No requests yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Send your first consultation request using the form above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((c) => (
              <div
                key={c._id}
                className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-heading font-semibold text-dark">
                      {c.topic}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3 w-3" /> Sent {formatDate(c.createdAt)}
                      {c.preferredMode && ` · prefers ${c.preferredMode}`}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                <p className="mt-3 whitespace-pre-wrap border-t border-slate-100 pt-3 text-sm text-slate-600">
                  {c.message}
                </p>

                {c.response && (
                  <div className="mt-4 rounded-lg bg-primary-light/60 p-4">
                    <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                      <MessagesSquare className="h-3.5 w-3.5" /> URAV team
                      {c.respondedAt && ` · ${formatDate(c.respondedAt)}`}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-dark">
                      {c.response}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
