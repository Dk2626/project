import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Blog — URAV",
  description:
    "Insights on careers, learning and hiring from the URAV team. Placeholder articles for now.",
};

const categories = ["All", "Careers", "Learning", "Hiring", "Product"];

const posts = [
  {
    title: "5 skills every fresher should learn in 2024",
    excerpt: "Placeholder excerpt — replace later. A quick look at the skills recruiters are asking for right now.",
    category: "Careers",
    date: "May 20, 2024",
    read: "5 min read",
    featured: true,
  },
  {
    title: "How to make the most of a live webinar",
    excerpt: "Placeholder excerpt — replace later. Simple habits to turn passive watching into real learning.",
    category: "Learning",
    date: "May 16, 2024",
    read: "4 min read",
  },
  {
    title: "Writing a resume that actually gets read",
    excerpt: "Placeholder excerpt — replace later. What to keep, what to cut, and how to stand out.",
    category: "Careers",
    date: "May 12, 2024",
    read: "6 min read",
  },
  {
    title: "A recruiter's guide to hiring on URAV",
    excerpt: "Placeholder excerpt — replace later. Post roles, review candidates and schedule interviews faster.",
    category: "Hiring",
    date: "May 8, 2024",
    read: "5 min read",
  },
  {
    title: "What's new: certifications and profiles",
    excerpt: "Placeholder excerpt — replace later. A round-up of the latest updates on the platform.",
    category: "Product",
    date: "May 2, 2024",
    read: "3 min read",
  },
  {
    title: "Preparing for your first tech interview",
    excerpt: "Placeholder excerpt — replace later. A calm, practical checklist for the days before.",
    category: "Careers",
    date: "Apr 28, 2024",
    read: "7 min read",
  },
];

export default function BlogPage() {
  const [featured, ...rest] = posts;

  return (
    <PageShell
      eyebrow="URAV Blog"
      title="Ideas, guides & updates"
      subtitle="Placeholder intro — replace later. Practical reads on careers, learning and hiring."
    >
      {/* Category filter (visual placeholder) */}
      <section className="container-page pt-10">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat, i) => (
            <span
              key={cat}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                i === 0
                  ? "bg-primary text-white"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Featured post */}
      <section className="container-page py-10">
        <Link
          href="/blog"
          className="group grid gap-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md md:grid-cols-2"
        >
          <div className="aspect-[16/10] bg-primary-light md:aspect-auto">
            <img
              src="/placeholders/webinar.svg"
              alt="Featured article — placeholder"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-8">
            <span className="w-fit rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
              {featured.category}
            </span>
            <h2 className="mt-4 font-heading text-2xl font-bold text-dark group-hover:text-primary">
              {featured.title}
            </h2>
            <p className="mt-3 text-slate-600">{featured.excerpt}</p>
            <div className="mt-5 flex items-center gap-4 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> {featured.date}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {featured.read}
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* Post grid */}
      <section className="container-page pb-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.title}
              href="/blog"
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="aspect-[16/10] bg-primary-light">
                <img
                  src="/placeholders/webinar.svg"
                  alt="Article thumbnail — placeholder"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <span className="w-fit rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
                  {post.category}
                </span>
                <h3 className="mt-3 font-heading text-lg font-semibold text-dark group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-slate-600">{post.excerpt}</p>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> {post.read}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-primary">
                    Read <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
