import { ReactNode } from "react";

type Tone = "new" | "upcoming" | "live" | "completed" | "active" | "inactive";

const tones: Record<Tone, string> = {
  new: "bg-primary-light text-primary",
  upcoming: "bg-warning/10 text-warning",
  live: "bg-danger/10 text-danger",
  completed: "bg-slate-100 text-slate-600",
  active: "bg-success/10 text-success",
  inactive: "bg-slate-100 text-slate-500",
};

export function Badge({
  children,
  tone = "new",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium font-body ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
