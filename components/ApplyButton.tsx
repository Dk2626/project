"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, LogIn } from "lucide-react";
import { api, ApiError } from "@/lib/client";
import { useAuth } from "@/components/AuthProvider";

interface ApplyButtonProps {
  kind: "job" | "webinar";
  targetId: string;
  /** True if the current user has already applied/registered. */
  alreadyApplied?: boolean;
  className?: string;
  size?: "sm" | "md";
  onApplied?: () => void;
}

export function ApplyButton({
  kind,
  targetId,
  alreadyApplied = false,
  className = "",
  size = "sm",
  onApplied,
}: ApplyButtonProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done">(
    alreadyApplied ? "done" : "idle"
  );
  const [error, setError] = useState("");

  const label = kind === "job" ? "Apply Now" : "Register";
  const doneLabel = kind === "job" ? "Applied" : "Registered";
  const sizeCls = size === "md" ? "h-11 px-6 text-[15px]" : "h-9 px-4 text-sm";

  async function handleApply() {
    // Login gate: not logged in -> go to login and come back here.
    if (!user) {
      const here = typeof window !== "undefined" ? window.location.pathname : "/";
      router.push(`/login?redirect=${encodeURIComponent(here)}`);
      return;
    }
    setError("");
    setState("loading");
    try {
      await api("/api/applications", {
        method: "POST",
        body: JSON.stringify(
          kind === "job" ? { jobId: targetId } : { webinarId: targetId }
        ),
      });
      setState("done");
      onApplied?.();
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setState("done"); // already applied
      } else {
        setError(err instanceof ApiError ? err.message : "Something went wrong.");
        setState("idle");
      }
    }
  }

  const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:opacity-70";

  if (state === "done") {
    return (
      <span
        className={`${base} ${sizeCls} cursor-default border border-success/30 bg-success/10 text-success ${className}`}
      >
        <Check className="h-4 w-4" /> {doneLabel}
      </span>
    );
  }

  return (
    <div className={size === "md" ? "" : "inline-block"}>
      <button
        type="button"
        onClick={handleApply}
        disabled={state === "loading" || loading}
        className={`${base} ${sizeCls} bg-primary text-white hover:bg-primary-hover ${className}`}
      >
        {state === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Working…
          </>
        ) : !user && !loading ? (
          <>
            <LogIn className="h-4 w-4" /> {kind === "job" ? "Login to Apply" : "Login to Register"}
          </>
        ) : (
          label
        )}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
