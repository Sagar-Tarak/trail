import type { ApiPage, ApiQueryParams } from "@/lib/api/types";

// respects AbortSignal so cancelled requests don't resolve after navigation
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

export interface ParsedFilters {
  search: string;
  sortKey: string | null;
  sortDir: "asc" | "desc" | null;
  page: number;
  pageSize: number;
  cursor: string | null;
  filters: Record<string, unknown>;
}

// filter keys are namespaced with "f." so they don't collide with pagination params
// e.g. f.status, f.dateRange.from, f.duration.min
export function parseParams(p: ApiQueryParams): ParsedFilters {
  const filters: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(p)) {
    if (!k.startsWith("f.")) continue;
    const rest = k.slice(2); // strip "f."

    // nested key like f.dateRange.from → filters.dateRange = { from: "..." }
    const dotIdx = rest.indexOf(".");
    if (dotIdx !== -1) {
      const parent = rest.slice(0, dotIdx);
      const sub = rest.slice(dotIdx + 1);
      if (!filters[parent] || typeof filters[parent] !== "object") {
        filters[parent] = {};
      }
      // coerce to number for min/max range fields
      const num = Number(v);
      (filters[parent] as Record<string, unknown>)[sub] = isNaN(num) ? v : num;
    } else {
      // multi-select values come in as comma-separated strings
      const str = String(v);
      filters[rest] = str.includes(",") ? str.split(",") : str;
    }
  }

  return {
    search: String(p.search ?? ""),
    sortKey: p.sortKey ? String(p.sortKey) : null,
    sortDir: (p.sortDir as "asc" | "desc") ?? null,
    page: Number(p.page ?? 1),
    pageSize: Number(p.pageSize ?? 20),
    cursor: p.cursor ? String(p.cursor) : null,
    filters,
  };
}

// locale-aware sort so "10" comes after "9" instead of between "1" and "2"
export function sortItems<T>(items: T[], sortKey: string, sortDir: "asc" | "desc"): T[] {
  return [...items].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortKey];
    const bv = (b as Record<string, unknown>)[sortKey];
    const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true, sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });
}

export function paginate<T extends object>(
  items: T[],
  page: number,
  pageSize: number,
  rowKey: keyof T | ((r: T) => string)
): ApiPage<T> {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  const hasMore = start + pageSize < total;

  // encode cursor as base64 JSON pointing at the last item on this page
  // this is mainly here so the shape matches a real cursor-paginated backend
  const lastItem = slice[slice.length - 1];
  const lastId = lastItem
    ? typeof rowKey === "function"
      ? rowKey(lastItem)
      : String(lastItem[rowKey])
    : null;

  const nextCursor = hasMore && lastId
    ? btoa(JSON.stringify({ id: lastId, page: page + 1 }))
    : null;

  return { items: slice, total, page, pageSize, hasMore, nextCursor };
}
