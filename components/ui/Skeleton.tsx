/**
 * Shimmer loading placeholders.
 *
 * Everything is built from `<Skeleton />`: a grey block with a highlight
 * sweeping across it (a real gradient sweep rather than `animate-pulse`,
 * which reads as a flashing box). The composed pieces below mirror the
 * shape of the real content so the layout doesn't jump when data lands.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block overflow-hidden rounded-md bg-slate-200/70 ${className}`}
    >
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </span>
  );
}

/** A few lines of fake text. The last line is short, like real prose. */
export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${i === lines - 1 ? "w-1/2" : "w-full"}`}
        />
      ))}
    </div>
  );
}

/** Wrapper that gives skeleton content the same card chrome as real rows. */
export function SkeletonCard({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-100 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** Placeholder matching the stat tiles on the dashboard overviews. */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="mt-4 h-8 w-16" />
          <Skeleton className="mt-2 h-3.5 w-24" />
        </SkeletonCard>
      ))}
    </div>
  );
}

/**
 * Placeholder for the person/company rows used across the dashboards:
 * avatar + name + meta line, then a grid of detail fields.
 */
export function SkeletonRecordList({
  rows = 3,
  fields = 6,
}: {
  rows?: number;
  fields?: number;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <SkeletonCard key={r}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: fields }).map((_, f) => (
              <div key={f} className="space-y-1.5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

/** Compact list placeholder — job cards, applications, webinars. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

/** Placeholder for a table, matching a given column count. */
export function SkeletonTable({
  rows = 6,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="flex gap-4 border-b border-slate-100 px-5 py-3">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 border-b border-slate-50 px-5 py-4 last:border-b-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Placeholder for the profile card on the student / recruiter dashboards. */
export function SkeletonProfile() {
  return (
    <SkeletonCard>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-60" />
          </div>
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
}

/** Full-page placeholder used while a dashboard layout checks the session. */
export function SkeletonPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <SkeletonStats />
      <SkeletonList rows={3} />
    </div>
  );
}
