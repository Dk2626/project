import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface PageShellProps {
  /** Small label shown above the title. */
  eyebrow?: string;
  title: string;
  /** Short supporting line under the title. */
  subtitle?: string;
  children: ReactNode;
}

/**
 * Shared shell for standard content pages (About, Services, Blog, etc.).
 * Renders the site chrome plus a consistent gradient page header so every
 * new page matches the existing Webinars / Jobs layout.
 */
export function PageShell({ eyebrow, title, subtitle, children }: PageShellProps) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-light">
        <section className="bg-gradient-to-b from-primary-light/60 to-light">
          <div className="container-page py-12 md:py-16">
            {eyebrow && (
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
                {eyebrow}
              </p>
            )}
            <h1 className="h1 text-dark">{title}</h1>
            {subtitle && (
              <p className="mt-3 max-w-2xl text-slate-600">{subtitle}</p>
            )}
          </div>
        </section>

        {children}
      </main>
      <Footer />
    </>
  );
}
