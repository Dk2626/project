import type { Metadata } from "next";
import { Target, Eye, HeartHandshake, Rocket, Users, Building2, GraduationCap, Award } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About — URAV",
  description:
    "Learn about URAV — our mission to empower careers and build futures through learning, webinars and job opportunities.",
};

const stats = [
  { icon: GraduationCap, value: "2.5K+", label: "Learners placed" },
  { icon: Award, value: "120+", label: "Webinars hosted" },
  { icon: Building2, value: "300+", label: "Partner companies" },
  { icon: Users, value: "50K+", label: "Community members" },
];

const values = [
  {
    icon: Target,
    title: "Our Mission",
    body: "Placeholder copy — replace later. To make quality learning and meaningful career opportunities accessible to every student and professional.",
  },
  {
    icon: Eye,
    title: "Our Vision",
    body: "Placeholder copy — replace later. A world where talent meets opportunity without barriers, powered by mentorship and real skills.",
  },
  {
    icon: HeartHandshake,
    title: "Our Values",
    body: "Placeholder copy — replace later. Integrity, growth, and community — we put learners first in everything we build.",
  },
  {
    icon: Rocket,
    title: "Our Promise",
    body: "Placeholder copy — replace later. Practical learning, expert guidance and a clear path from your first webinar to your next role.",
  },
];

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About URAV"
      title="Empowering Careers. Building Futures."
      subtitle="Placeholder intro — replace with your real story later. URAV is a corporate consulting and career platform connecting students, professionals and organizations."
    >
      {/* Story */}
      <section className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-primary-light shadow-md">
            <img
              src="/hero-students.webp"
              alt="URAV students on campus"
              className="h-full w-full object-cover"
              style={{ objectPosition: "center 28%" }}
            />
          </div>
          <div>
            <h2 className="h2 text-dark">Our Story</h2>
            <p className="mt-4 text-slate-600">
              Placeholder text — replace later. URAV started with a simple idea: learning and career
              growth should not be locked behind expensive courses or closed networks.
            </p>
            <p className="mt-4 text-slate-600">
              Today we bring together expert-led webinars, hands-on learning and a curated jobs board
              so that every learner can move forward with confidence.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="primary" href="/webinars">
                Explore Webinars
              </Button>
              <Button variant="outline" href="/contact">
                Get in Touch
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container-page pb-4">
        <div className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-md sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <p className="font-heading text-2xl font-bold text-dark">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="container-page py-12">
        <h2 className="h2 text-dark">What drives us</h2>
        <p className="mt-2 max-w-xl text-slate-600">
          Placeholder section — swap in your real mission, vision and values.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {values.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-light text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold text-dark">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-16">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-primary px-8 py-12 text-center">
          <h2 className="font-heading text-2xl font-bold text-white">Ready to build your future?</h2>
          <p className="max-w-md text-primary-light/90">
            Join thousands of learners growing their careers with URAV.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Button variant="outline" href="/register" className="border-white/30 bg-white text-primary hover:bg-white/90">
              Create an account
            </Button>
            <Button variant="ghost" href="/services" className="text-white hover:bg-white/10">
              Our Services
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
