import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact — URAV",
  description: "Get in touch with the URAV team. Placeholder contact details for now.",
};

const details = [
  { icon: Mail, label: "Email", value: "hello@urav.example", href: "mailto:hello@urav.example" },
  { icon: Phone, label: "Phone", value: "+91 00000 00000", href: "tel:+910000000000" },
  { icon: MapPin, label: "Office", value: "Placeholder address, City, India" },
  { icon: Clock, label: "Hours", value: "Mon – Fri, 9:00 AM – 6:00 PM" },
];

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Let's talk"
      subtitle="Placeholder intro — replace later. Questions, partnerships or support — we'd love to hear from you."
    >
      <section className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          {/* Contact details */}
          <div>
            <h2 className="h3 text-dark">Reach us directly</h2>
            <p className="mt-2 text-sm text-slate-600">
              Placeholder details — swap in your real contact information.
            </p>
            <ul className="mt-6 space-y-4">
              {details.map(({ icon: Icon, label, value, href }) => (
                <li key={label} className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {label}
                    </p>
                    {href ? (
                      <a href={href} className="text-sm font-medium text-dark hover:text-primary">
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-dark">{value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Map placeholder */}
            <div className="mt-8 grid aspect-[16/9] place-items-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
              Map placeholder
            </div>
          </div>

          {/* Form */}
          <div>
            <h2 className="h3 text-dark">Send a message</h2>
            <p className="mt-2 text-sm text-slate-600">
              Fill in the form and we&apos;ll get back to you soon.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
