import type { QueryParams } from "@/layouts/MasterTablePage/types";
import type { ApiQueryParams } from "./types";

/**
 * Converts the controller's QueryParams into a flat object suitable for
 * building a URL query string or passing to a mock handler.
 *
 * Filters are expanded as top-level keys with a "f." prefix so the server
 * can distinguish them from pagination/sort params:
 *   f.module=Finance&f.status=success,error&f.duration.min=100
 */
export function buildApiParams(params: QueryParams): ApiQueryParams {
  const out: ApiQueryParams = {
    page: params.page,
    pageSize: params.pageSize,
  };

  if (params.search) out.search = params.search;
  if (params.sortKey) out.sortKey = params.sortKey;
  if (params.sortDir) out.sortDir = params.sortDir;
  if (params.cursor) out.cursor = params.cursor;

  // Expand filters as flat "f.<key>" keys
  for (const [key, value] of Object.entries(params.filters)) {
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) out[`f.${key}`] = value.join(",");
    } else if (typeof value === "object") {
      // date-range / number-range — expand as f.key.from / f.key.to or f.key.min / f.key.max
      for (const [sub, subVal] of Object.entries(value as Record<string, unknown>)) {
        if (subVal !== null && subVal !== undefined && subVal !== "") {
          out[`f.${key}.${sub}`] = subVal;
        }
      }
    } else {
      out[`f.${key}`] = value;
    }
  }

  return out;
}

/** Turns ApiQueryParams into a URL query string */
export function toQueryString(p: ApiQueryParams): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  }
  return qs.toString();
}
