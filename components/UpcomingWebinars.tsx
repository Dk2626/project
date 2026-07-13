"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, UserRound, Video } from "lucide-react";
import { webinars as fallbackWebinars } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/client";
import type { WebinarItem } from "@/lib/types";

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function UpcomingWebinars() {
  const [items, setItems] = useState<WebinarItem[] | null>(null);

  useEffect(() => {
    api<WebinarItem[]>("/api/webinars")
      .then((data) => setItems(data.slice(0, 3)))
      .catch(() => setItems([]));
  }, []);

  const useLive = items && items.length > 0;

  return (
    <section className="container-page py-14">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="h3 text-dark">Upcoming Webinars</h2>
        <Link href="/webinars" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {useLive
          ? items!.map((w) => (
              <article
                key={w._id}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-primary to-primary-hover">
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
                  <Button variant="primary" size="sm" className="mt-5 w-full" href="/webinars">
                    Register Now
                  </Button>
                </div>
              </article>
            ))
          : fallbackWebinars.map((w) => (
              <article
                key={w.title}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-primary to-primary-hover">
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
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {w.date}
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
                  <Button variant="primary" size="sm" className="mt-5 w-full" href="/webinars">
                    Register Now
                  </Button>
                </div>
              </article>
            ))}
      </div>
    </section>
  );
}
