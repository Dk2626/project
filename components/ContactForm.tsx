"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

const fieldClass =
  "w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-dark placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Dummy submit for now — wire this up to a real endpoint later.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h3 className="font-heading text-lg font-semibold text-dark">Message sent</h3>
        <p className="max-w-sm text-sm text-slate-600">
          Thanks for reaching out. This is a placeholder confirmation — connect the form to your
          backend to start receiving messages.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-2 text-sm font-medium text-primary hover:underline"
        >
          Send another message
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
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dark" htmlFor="name">
            Full name
          </label>
          <input id="name" name="name" required placeholder="Your name" className={fieldClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dark" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-dark" htmlFor="subject">
          Subject
        </label>
        <input id="subject" name="subject" placeholder="How can we help?" className={fieldClass} />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-dark" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Write your message…"
          className={`${fieldClass} resize-y`}
        />
      </div>

      <button
        type="submit"
        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-[15px] font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
      >
        <Send className="h-4 w-4" /> Send message
      </button>
    </form>
  );
}
