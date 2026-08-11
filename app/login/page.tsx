"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Video,
  Briefcase,
  Award,
  TrendingUp,
  Users,
  AlertCircle,
} from "lucide-react";
import { api, ApiError } from "@/lib/client";
import { useAuth } from "@/components/AuthProvider";
import { useRedirectIfAuthed, landingFor } from "@/components/RedirectIfAuthed";
import { Logo } from "@/components/Logo";
import type { AuthUser } from "@/lib/types";

const highlights = [
  { icon: Video, title: "Live Webinars", desc: "Learn from industry experts" },
  { icon: Briefcase, title: "Top Job Opportunities", desc: "Find the right role that fits you" },
  { icon: Award, title: "Certifications", desc: "Boost your skills and stand out" },
  { icon: TrendingUp, title: "Career Growth", desc: "Build, connect and grow your career" },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect");
  const { setUser } = useAuth();
  // Signed-in visitors never see this form — they go to their dashboard.
  useRedirectIfAuthed();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api<{ user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      router.push(redirect || landingFor(data.user.role));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not log in. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-light px-4 py-8 md:py-12">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl lg:grid-cols-12">
        {/* Left brand panel */}
        <aside className="relative hidden flex-col justify-between bg-gradient-to-b from-primary-light to-white p-8 lg:col-span-5 lg:flex xl:p-10">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <Logo size={44} />
              <span className="leading-tight">
                <span className="block font-heading text-2xl font-bold text-dark">URAV</span>
                <span className="block text-[10px] font-medium uppercase tracking-[0.25em] text-slate-400">
                  Learn · Grow · Succeed
                </span>
              </span>
            </Link>

            <h1 className="mt-10 font-heading text-3xl font-bold leading-tight text-dark xl:text-[34px]">
              Welcome back.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              Log in to apply for jobs, register for webinars and track your application status.
            </p>

            <ul className="mt-8 space-y-4">
              {highlights.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-heading text-sm font-semibold text-dark">{title}</span>
                    <span className="block text-xs text-slate-500">{desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-white shadow-lg">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/20">
              <Users className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] opacity-90">Trusted by</span>
              <span className="block font-heading text-lg font-bold">2.5K+ Users</span>
            </span>
          </div>
        </aside>

        {/* Right form */}
        <section className="p-6 sm:p-8 lg:col-span-7 xl:p-10">
          <Link href="/" className="mb-6 flex items-center gap-2 lg:hidden">
            <Logo size={32} />
            <span className="font-heading text-xl font-bold text-dark">URAV</span>
          </Link>

          <div className="mx-auto max-w-md">
            <h1 className="font-heading text-2xl font-bold text-dark sm:text-[28px]">
              Login to your account
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              New to URAV?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>

            {redirect && (
              <div className="mt-5 rounded-lg border border-primary/20 bg-primary-light px-4 py-3 text-sm text-primary">
                Please log in to continue.
              </div>
            )}

            {error && (
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm text-dark placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-10 text-sm text-dark placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-2 h-12 w-full rounded-md bg-primary font-medium text-white shadow-md transition-colors hover:bg-primary-hover disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
              >
                {submitting ? "Logging in…" : "Login"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-light" />}>
      <LoginForm />
    </Suspense>
  );
}
