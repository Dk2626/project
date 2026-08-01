"use client";

import { useEffect, useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/client";
import { useAuth } from "@/components/AuthProvider";
import type { ConsultationRecord } from "@/lib/types";

const TOPICS = [
  "Career Guidance",
  "Course Selection",
  "Higher Studies",
  "Job Search",
  "Resume Review",
  "Interview Preparation",
  "Webinar / Training",
  "Other",
];

const MODES = ["Email", "Phone Call", "Video Call"];

const fieldClass =
  "w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-dark placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-dark" htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * The form a student uses to ask the URAV team for a consultation.
 *
 * Works signed-out as well as signed-in — a visitor can ask a question before
 * they register. When someone *is* logged in their name, email and phone are
 * pre-filled from their profile and the request is linked to their account, so
 * they can follow the reply from "My requests".
 */
export function ConsultationForm({
  onSubmitted,
}: {
  onSubmitted?: (item: ConsultationRecord) => void;
}) {
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    studentType: "College Student",
    institution: "",
    topic: TOPICS[0],
    preferredMode: MODES[0],
    preferredTime: "",
    message: "",
  });

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  // Pre-fill from the signed-in student's profile. Only fills blanks, so it
  // never clobbers something the visitor has already typed.
  useEffect(() => {
    if (authLoading || !user) return;

    setForm((f) => ({
      ...f,
      name: f.name || user.name || "",
      email: f.email || user.email || "",
    }));

    if (user.role !== "student") return;
    api<any>("/api/profile")
      .then((me) => {
        if (!me) return;
        setForm((f) => ({
          ...f,
          phone: f.phone || me.phone || "",
          studentType:
            me.studentType === "School Student" ? "School Student" : f.studentType,
          institution: f.institution || me.college || me.schoolName || "",
        }));
      })
      .catch(() => {
        /* pre-fill is a convenience — a failure here is not worth surfacing */
      });
  }, [user, authLoading]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;

    setError("");
    setSending(true);
    try {
      const created = await api<ConsultationRecord>("/api/consultations", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSent(true);
      onSubmitted?.(created);
    } catch (err: any) {
      setError(err?.message ?? "Could not send your request. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setForm((f) => ({ ...f, topic: TOPICS[0], preferredTime: "", message: "" }));
    setSent(false);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h3 className="font-heading text-lg font-semibold text-dark">
          Request received
        </h3>
        <p className="max-w-sm text-sm text-slate-600">
          Thanks for reaching out. Our team will review your request and get back
          to you on {form.preferredMode.toLowerCase() === "email" ? "email" : `your ${form.preferredMode.toLowerCase()}`}.
          {user
            ? " You can track it under “My requests” below."
            : " Register with URAV to track your requests in one place."}
        </p>
        <button
          onClick={reset}
          className="mt-2 text-sm font-medium text-primary hover:underline"
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="c-name" required>
          <input
            id="c-name"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name"
            className={fieldClass}
          />
        </Field>

        <Field label="Email" htmlFor="c-email" required>
          <input
            id="c-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
            className={fieldClass}
          />
        </Field>

        <Field label="Phone" htmlFor="c-phone">
          <input
            id="c-phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+91 00000 00000"
            className={fieldClass}
          />
        </Field>

        <Field label="I am a" htmlFor="c-type">
          <select
            id="c-type"
            value={form.studentType}
            onChange={(e) => set("studentType", e.target.value)}
            className={fieldClass}
          >
            <option>College Student</option>
            <option>School Student</option>
            <option>Other</option>
          </select>
        </Field>

        <Field label="School / College" htmlFor="c-institution">
          <input
            id="c-institution"
            value={form.institution}
            onChange={(e) => set("institution", e.target.value)}
            placeholder="Where you study"
            className={fieldClass}
          />
        </Field>

        <Field label="What is this about?" htmlFor="c-topic">
          <select
            id="c-topic"
            value={form.topic}
            onChange={(e) => set("topic", e.target.value)}
            className={fieldClass}
          >
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>

        <Field label="Preferred way to reach you" htmlFor="c-mode">
          <select
            id="c-mode"
            value={form.preferredMode}
            onChange={(e) => set("preferredMode", e.target.value)}
            className={fieldClass}
          >
            {MODES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>

        <Field label="Best time to reach you" htmlFor="c-time">
          <input
            id="c-time"
            value={form.preferredTime}
            onChange={(e) => set("preferredTime", e.target.value)}
            placeholder="e.g. weekday evenings after 6pm"
            className={fieldClass}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Your message" htmlFor="c-message" required>
          <textarea
            id="c-message"
            required
            rows={5}
            minLength={10}
            maxLength={4000}
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="Tell us what you'd like help with — your goals, what you're studying, and any questions you have."
            className={`${fieldClass} resize-y`}
          />
        </Field>
        <p className="mt-1.5 text-xs text-slate-400">
          {form.message.length}/4000 characters
        </p>
      </div>

      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-[15px] font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {sending ? "Sending…" : "Request consultation"}
      </button>
    </form>
  );
}
