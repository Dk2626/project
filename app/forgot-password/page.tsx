"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, AlertCircle, ArrowLeft, MailCheck } from "lucide-react";
import { api, ApiError } from "@/lib/client";
import { useRedirectIfAuthed } from "@/components/RedirectIfAuthed";
import { Logo } from "@/components/Logo";

export default function ForgotPasswordPage() {
  // Signed-in visitors have no business here — send them to their dashboard.
  useRedirectIfAuthed();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!email.trim()) {
      setError("Enter the email address on your account.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(data.message);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not send the reset link. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-light px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <Link href="/" className="mb-6 flex items-center gap-2">
          <Logo size={32} />
          <span className="font-heading text-xl font-bold text-dark">URAV</span>
        </Link>

        {sent ? (
          <>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-light text-primary">
              <MailCheck className="h-6 w-6" />
            </span>
            <h1 className="mt-4 font-heading text-2xl font-bold text-dark">
              Check your email
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{sent}</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              The link works for 60 minutes and can be used once. Nothing
              arrived after a few minutes?{" "}
              <button
                type="button"
                onClick={() => setSent("")}
                className="font-medium text-primary hover:underline"
              >
                Try a different email
              </button>
              .
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-heading text-2xl font-bold text-dark">
              Forgot your password?
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Enter the email address you registered with and we&apos;ll send
              you a link to set a new password.
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
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
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

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="h-12 w-full rounded-md bg-primary font-medium text-white shadow-md transition-colors hover:bg-primary-hover disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
              >
                {submitting ? "Sending link…" : "Send reset link"}
              </button>
            </div>

            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
