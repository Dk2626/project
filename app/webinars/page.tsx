"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, UserRound, Video } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/Badge";
import { ApplyButton } from "@/components/ApplyButton";
import { api } from "@/lib/client";
import { useAuth } from "@/components/AuthProvider";
import type { WebinarItem, ApplicationItem } from "@/lib/types";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function WebinarsPage() {
  const { user } = useAuth();
  const [webinars, setWebinars] = useState<WebinarItem[]>([]);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<WebinarItem[]>("/api/webinars")
      .then(setWebinars)
      .catch(() => setWebinars([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      setRegisteredIds(new Set());
      return;
    }
    api<ApplicationItem[]>("/api/applications?kind=webinar")
      .then((apps) =>
        setRegisteredIds(
          new Set(apps.map((a) => a.webinar?._id).filter(Boolean) as string[])
        )
      )
      .catch(() => {});
  }, [user]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-light">
        <section className="bg-gradient-to-b from-primary-light/60 to-light">
          <div className="container-page py-12 md:py-16">
            <h1 className="h1 text-dark">Upcoming Webinars</h1>
            <p className="mt-3 max-w-xl text-slate-600">
              Learn from industry experts. Register to save your seat and get the joining link.
            </p>
          </div>
        </section>

        <section className="container-page py-10">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl bg-white" />
              ))}
            </div>
          ) : webinars.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Video className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 font-heading text-lg font-semibold text-dark">
                No webinars scheduled yet
              </p>
              <p className="mt-1 text-sm text-slate-500">Check back soon for new sessions.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {webinars.map((w) => (
                <article
                  key={w._id}
                  className="flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-primary to-primary-hover">
                    <Video className="h-10 w-10 text-white/80" />
                    {w.live && (
                      <Badge tone="live" className="absolute left-3 top-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                        LIVE
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-heading text-lg font-semibold text-dark">{w.title}</h3>
                    {w.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">
                        {w.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {formatDate(w.date)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {w.time}
                      </span>
                    </div>

                    <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100">
                        <UserRound className="h-3.5 w-3.5" />
                      </span>
                      By {w.speaker}
                    </div>

                    <div className="mt-5">
                      <ApplyButton
                        kind="webinar"
                        targetId={w._id}
                        alreadyApplied={registeredIds.has(w._id)}
                        className="w-full"
                      />
                    </div>
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
