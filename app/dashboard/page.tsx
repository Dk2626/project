"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Video,
  FileText,
  Calendar,
  Clock,
  Building2,
  Trash2,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StatusBadge } from "@/components/StatusBadge";
import { ProfileCard } from "@/components/ProfileCard";
import { SkeletonPage, SkeletonList } from "@/components/ui/Skeleton";
import { api } from "@/lib/client";
import { useAuth } from "@/components/AuthProvider";
import { isAdminRole, type ApplicationItem } from "@/lib/types";

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

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"job" | "webinar">("job");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/dashboard");
    } else if (isAdminRole(user.role)) {
      // Admins and superadmins have no student dashboard — send them to /admin.
      router.replace("/admin");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || isAdminRole(user.role)) return;
    api<ApplicationItem[]>("/api/applications")
      .then(setApps)
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, [user]);

  const jobApps = useMemo(() => apps.filter((a) => a.kind === "job"), [apps]);
  const webinarApps = useMemo(
    () => apps.filter((a) => a.kind === "webinar"),
    [apps]
  );
  const list = tab === "job" ? jobApps : webinarApps;

  async function withdraw(id: string) {
    if (!confirm("Withdraw this application?")) return;
    try {
      await api(`/api/applications/${id}`, { method: "DELETE" });
      setApps((prev) => prev.filter((a) => a._id !== id));
    } catch {
      alert("Could not withdraw. Please try again.");
    }
  }

  if (authLoading || !user || isAdminRole(user.role)) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-light">
          <div className="container-page py-16">
            <SkeletonPage />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-light">
        <section className="bg-gradient-to-b from-primary-light/60 to-light">
          <div className="container-page py-10 md:py-12">
            <p className="text-sm font-medium text-primary">My Dashboard</p>
            <h1 className="mt-1 font-heading text-3xl font-bold text-dark">
              Hi {user.name.split(" ")[0]} 👋
            </h1>
            <p className="mt-2 text-slate-600">
              Track your job applications and webinar registrations here.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={<Briefcase className="h-5 w-5" />}
                label="Job Applications"
                value={jobApps.length}
              />
              <StatCard
                icon={<Video className="h-5 w-5" />}
                label="Webinar Registrations"
                value={webinarApps.length}
              />
              <StatCard
                icon={<FileText className="h-5 w-5" />}
                label="Total Activity"
                value={apps.length}
              />
            </div>

            {/* Ask the counselling team a question. */}
            <Link
              href="/consultation"
              className="mt-4 flex items-center gap-3 rounded-lg border border-primary/30 bg-white px-4 py-3 text-sm shadow-sm hover:border-primary/60"
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-slate-700">
                Need guidance? Send the URAV team a consultation request and
                track their reply.
              </span>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-primary" />
            </Link>
          </div>
        </section>

        <section className="container-page py-8">
          {/* My Profile */}
          {user.role === "student" && (
            <div className="mb-8">
              <h2 className="mb-3 font-heading text-lg font-semibold text-dark">
                My Profile
              </h2>
              <ProfileCard />
            </div>
          )}

          {/* Tabs */}
          <div className="mb-5 flex gap-2 rounded-lg border border-slate-200 bg-white p-1 sm:w-fit">
            <TabButton active={tab === "job"} onClick={() => setTab("job")}>
              <Briefcase className="h-4 w-4" /> Jobs ({jobApps.length})
            </TabButton>
            <TabButton
              active={tab === "webinar"}
              onClick={() => setTab("webinar")}
            >
              <Video className="h-4 w-4" /> Webinars ({webinarApps.length})
            </TabButton>
          </div>

          {loading ? (
            <SkeletonList rows={3} />
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              {tab === "job" ? (
                <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
              ) : (
                <Video className="mx-auto h-10 w-10 text-slate-300" />
              )}
              <p className="mt-4 font-heading text-lg font-semibold text-dark">
                {tab === "job"
                  ? "You haven't applied to any jobs yet"
                  : "You haven't registered for any webinars yet"}
              </p>
              <Link
                href={tab === "job" ? "/jobs" : "/webinars"}
                className="mt-5 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover"
              >
                {tab === "job" ? "Browse jobs" : "Browse webinars"}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((a) => {
                const target = tab === "job" ? a.job : a.webinar;
                if (!target) return null;
                return (
                  <div
                    key={a._id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
                        {tab === "job" ? (
                          <Building2 className="h-5 w-5" />
                        ) : (
                          <Video className="h-5 w-5" />
                        )}
                      </span>
                      <div>
                        <p className="font-heading font-semibold text-dark">
                          {target.title}
                        </p>
                        <p className="text-sm text-slate-500">
                          {tab === "job"
                            ? (a.job as any)?.company
                            : `By ${(a.webinar as any)?.speaker}`}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                          {tab === "job" ? (
                            <>
                              <Clock className="h-3 w-3" /> Applied{" "}
                              {formatDate(a.createdAt)}
                            </>
                          ) : (
                            <>
                              <Calendar className="h-3 w-3" />{" "}
                              {formatDate((a.webinar as any)?.date)} ·{" "}
                              {(a.webinar as any)?.time}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <StatusBadge status={a.status} />
                      <button
                        onClick={() => withdraw(a._id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Withdraw
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </section>
      </main>
      <Footer />
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-light text-primary">
        {icon}
      </span>
      <div>
        <p className="font-heading text-2xl font-bold text-dark">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
        active ? "bg-primary text-white" : "text-slate-600 hover:bg-light"
      }`}
    >
      {children}
    </button>
  );
}
