"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Build the page numbers to display, collapsing long ranges with ellipses:
 *   1 … 4 5 [6] 7 8 … 42
 */
function pageWindow(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);

  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < pages - 1) out.push("…");

  out.push(pages);
  return out;
}

export interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  /** What's being counted, for the "Showing 1–10 of 84 students" line. */
  label?: string;
  /** Dim the control while the next page is in flight. */
  busy?: boolean;
}

const PAGE_SIZES = [10, 25, 50, 100];

export function Pagination({
  page,
  pages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  label = "results",
  busy = false,
}: PaginationProps) {
  if (total === 0) return null;

  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  const btn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-200 px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div
      className={`mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between ${
        busy ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
        <span>
          Showing <span className="font-medium text-dark">{first}</span>–
          <span className="font-medium text-dark">{last}</span> of{" "}
          <span className="font-medium text-dark">{total}</span> {label}
        </span>

        {onLimitChange && (
          <label className="inline-flex items-center gap-2">
            <span className="text-slate-400">Per page</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || busy}
            aria-label="Previous page"
            className={`${btn} text-slate-600 hover:bg-light`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageWindow(page, pages).map((p, i) =>
            p === "…" ? (
              <span
                key={`gap-${i}`}
                className="px-1 text-sm text-slate-400"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                disabled={busy}
                aria-current={p === page ? "page" : undefined}
                className={`${btn} ${
                  p === page
                    ? "border-primary bg-primary text-white"
                    : "text-slate-600 hover:bg-light"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages || busy}
            aria-label="Next page"
            className={`${btn} text-slate-600 hover:bg-light`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
