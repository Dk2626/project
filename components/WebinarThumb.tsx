"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { WEBINAR_FALLBACK_IMAGE } from "@/lib/webinarMedia";
import { Video } from "lucide-react";

/**
 * Cover image for a webinar card.
 *
 * Falls back to the built-in photo both when no image was uploaded and when
 * the stored URL fails to load (deleted from the bucket, bad link), so a card
 * never renders as an empty box.
 */
export function WebinarThumb({
  src,
  alt = "",
  live,
  className = "h-40",
}: {
  src?: string | null;
  alt?: string;
  live?: boolean;
  className?: string;
}) {
  const initial = src?.trim() || WEBINAR_FALLBACK_IMAGE;
  const [current, setCurrent] = useState(initial);

  // Keep up with a changed prop (e.g. after the list reloads).
  useEffect(() => setCurrent(initial), [initial]);

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-primary to-primary-hover ${className}`}
    >
      <img
        src={current}
        alt={alt}
        loading="lazy"
        onError={() => setCurrent(WEBINAR_FALLBACK_IMAGE)}
        className="h-full w-full object-cover"
      />

      {/* Play badge, centred over the cover. `pointer-events-none` so it never
          swallows a click meant for the card link underneath. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm ring-1 ring-white/25">
          <Video className="h-10 w-10 text-white/80" />
        </span>
      </div>

      {/* {live && (
        <Badge tone="live" className="absolute left-3 top-3">
          <span className="h-1.5 w-1.5 rounded-full bg-danger" />
          LIVE
        </Badge>
      )} */}
    </div>
  );
}
