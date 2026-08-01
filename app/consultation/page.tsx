"use client";

import { useState } from "react";
import { Compass, GraduationCap, Briefcase, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ConsultationForm } from "@/components/ConsultationForm";
import { MyConsultations } from "@/components/MyConsultations";

const points = [
  {
    icon: Compass,
    title: "Career direction",
    text: "Talk through streams, courses and where they actually lead.",
  },
  {
    icon: GraduationCap,
    title: "Higher studies",
    text: "Entrance exams, applications and picking the right institution.",
  },
  {
    icon: Briefcase,
    title: "Getting hired",
    text: "Resume feedback, interview prep and the roles worth applying for.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    text: "Your request goes only to the URAV team — never to recruiters.",
  },
];

export default function ConsultationPage() {
  // Bumped after a submit so the "My requests" list below refetches.
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <PageShell
      eyebrow="Consultation"
      title="Talk to a URAV counsellor"
      subtitle="Tell us where you are and what you're aiming for. A counsellor will read your request and get back to you on your preferred channel."
    >
      <section className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          {/* What we help with */}
          <div>
            <h2 className="h3 text-dark">What we can help with</h2>
            <p className="mt-2 text-sm text-slate-600">
              Free guidance for school and college students, one request at a
              time.
            </p>
            <ul className="mt-6 space-y-4">
              {points.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-dark">{title}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Form */}
          <div>
            <h2 className="h3 text-dark">Request a consultation</h2>
            <p className="mt-2 text-sm text-slate-600">
              Fill in the form and we&apos;ll be in touch. Signed in? Your details
              are filled in for you.
            </p>
            <div className="mt-6">
              <ConsultationForm onSubmitted={() => setRefreshKey((k) => k + 1)} />
            </div>
          </div>
        </div>

        {/* Only renders for a signed-in student. */}
        <div className="mt-14">
          <MyConsultations refreshKey={refreshKey} />
        </div>
      </section>
    </PageShell>
  );
}
