"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import type { Paginated } from "@/lib/types";

export interface PaginatedResponse<T> extends Paginated<T> {
  /** Optional per-tab totals some endpoints return alongside the page. */
  counts?: Record<string, number>;
}

export interface UsePaginatedListOptions {
  /** Endpoint path, without query string — e.g. "/api/admin/students". */
  path: string;
  /** Extra query params (tab filters etc). Changing these resets to page 1. */
  params?: Record<string, string | undefined>;
  initialLimit?: number;
  /** Milliseconds to wait after typing before hitting the API. */
  debounceMs?: number;
}

/**
 * Server-side pagination for a list screen.
 *
 * Rather than pulling every record down and filtering in the browser, this
 * asks the API for one page at a time and lets MongoDB do the searching.
 * Typing in the search box is debounced so we don't fire a request per
 * keystroke, and page changes keep the previous rows on screen (dimmed via
 * `fetching`) instead of flashing the skeleton again.
 */
export function usePaginatedList<T>({
  path,
  params,
  initialLimit = 10,
  debounceMs = 350,
}: UsePaginatedListOptions) {
  const [items, setItems] = useState<T[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  /** True only for the very first load — that's when we show the shimmer. */
  const [loading, setLoading] = useState(true);
  /** True for every subsequent fetch (page change, search, tab switch). */
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const loadedOnce = useRef(false);
  const requestId = useRef(0);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  const paramKey = JSON.stringify(params ?? {});

  // Any change to the filters or the search term puts us back on page 1 —
  // page 4 of the old result set is meaningless for the new one.
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, paramKey, limit]);

  const load = useCallback(async () => {
    const id = ++requestId.current;

    if (loadedOnce.current) setFetching(true);
    setError("");

    const search = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (debouncedQuery) search.set("q", debouncedQuery);
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v) search.set(k, v);
    }

    try {
      const data = await api<PaginatedResponse<T>>(`${path}?${search}`);
      // A slower earlier request may land after a newer one — ignore it.
      if (id !== requestId.current) return;

      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setCounts(data.counts ?? {});
    } catch (e: any) {
      if (id !== requestId.current) return;
      setItems([]);
      setTotal(0);
      setPages(1);
      setError(e?.message ?? "Could not load this list.");
    } finally {
      if (id === requestId.current) {
        loadedOnce.current = true;
        setLoading(false);
        setFetching(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, page, limit, debouncedQuery, paramKey]);

  useEffect(() => {
    load();
  }, [load]);

  /** Patch one row in place — avoids a refetch after an inline edit. */
  const patchItem = useCallback(
    (match: (item: T) => boolean, next: Partial<T> | ((item: T) => T)) => {
      setItems((prev) =>
        prev.map((item) =>
          match(item)
            ? typeof next === "function"
              ? (next as (i: T) => T)(item)
              : { ...item, ...next }
            : item
        )
      );
    },
    []
  );

  /** Drop a row locally, then refresh so the page stays full. */
  const removeItem = useCallback(
    (match: (item: T) => boolean) => {
      setItems((prev) => prev.filter((item) => !match(item)));
      setTotal((t) => Math.max(0, t - 1));
    },
    []
  );

  return {
    items,
    counts,
    total,
    pages,
    page,
    limit,
    query,
    loading,
    fetching,
    error,
    setPage,
    setLimit,
    setQuery,
    reload: load,
    patchItem,
    removeItem,
    setItems,
  };
}
