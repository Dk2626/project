import Link from "next/link";
import { Linkedin, Instagram } from "lucide-react";
import { footerColumns } from "@/lib/data";
import { Logo } from "@/components/Logo";

/* X (formerly Twitter) logo — lucide-react has no X icon, so this is an inline SVG */
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

const socials = [
  { icon: XIcon, label: "X", href: "https://x.com/URAVCTC" },
  {
    icon: Linkedin,
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/deva-rajan-tate",
  },
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://www.instagram.com/uravctc?igsh=MWN6MTR3Ym1pcWh6dQ==",
  },
];

export function Footer() {
  return (
    <footer className="bg-dark text-slate-300">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={34} variant="white" />
              <span className="font-heading text-xl font-bold text-white">URAV</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Empowering careers and organizations through learning, consulting
              and opportunities.
            </p>
            <div className="mt-5 flex gap-3">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-slate-300 transition-colors hover:bg-primary hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.heading}>
              <h4 className="font-heading text-sm font-semibold text-white">
                {col.heading}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={`${col.heading}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-slate-500">
          © 2024 URAV. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
