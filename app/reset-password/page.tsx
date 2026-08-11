"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { api, ApiError } from "@/lib/client";
import { Logo } from "@/components/Logo";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-light px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <Link href="/" className="mb-6 flex items-center gap-2">
          <Logo size={32} />
          <span className="font-heading text-xl font-bold text-dark">URAV</span>
        </Link>
        {children}
      </div>
    </main>
  );
}

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  // "checking" until the token has been validated against the server.
  const [status, setStatus] = useState<"checking" | "ready" | "dead" | "done">(
    "checking"
  );
  const [email, setEmail] = useState("");
  const [linkError, setLinkError] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check the link the moment the page opens, so a dead link says so
  // straight away instead of after they've typed a password twice.
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setLinkError("This reset link is missing its token. Please request a new one.");
      setStatus("dead");
      return;
    }
    (async () => {
      try {
        const data = await api<{ email: string }>(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}`
        );
        if (cancelled) return;
        setEmail(data.email);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setLinkError(
          err instanceof ApiError
            ? err.message
            : "We couldn't check this link. Please request a new one."
        );
        setStatus("dead");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit() {
    setError("");
    if (!password) return setError("Enter a new password.");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setSubmitting(true);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setStatus("done");
      // Give them a moment to read the confirmation, then on to login.
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not reset your password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "checking") {
    return (
      <Shell>
        <div className="space-y-3">
          <div className="h-7 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-11 w-full animate-pulse rounded-md bg-slate-100" />
          <div className="h-11 w-full animate-pulse rounded-md bg-slate-100" />
          <div className="h-12 w-full animate-pulse rounded-md bg-slate-100" />
        </div>
      </Shell>
    );
  }

  if (status === "dead") {
    return (
      <Shell>
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-danger/10 text-danger">
          <AlertCircle className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-heading text-2xl font-bold text-dark">
          Link no longer valid
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{linkError}</p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary font-medium text-white shadow-md transition-colors hover:bg-primary-hover"
        >
          Request a new link
        </Link>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </Shell>
    );
  }

  if (status === "done") {
    return (
      <Shell>
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-success/10 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-heading text-2xl font-bold text-dark">
          Password updated
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          You can now log in with your new password. Taking you to the login
          page…
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary font-medium text-white shadow-md transition-colors hover:bg-primary-hover"
        >
          Go to login
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-heading text-2xl font-bold text-dark">
        Set a new password
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        for <span className="font-medium text-dark">{email}</span>
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            New Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock className="h-4 w-4" />
            </span>
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock className="h-4 w-4" />
            </span>
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-10 text-sm text-dark placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-2 h-12 w-full rounded-md bg-primary font-medium text-white shadow-md transition-colors hover:bg-primary-hover disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
        >
          {submitting ? "Updating…" : "Update password"}
        </button>
      </div>
    </Shell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-light" />}>
      <ResetForm />
    </Suspense>
  );
}
