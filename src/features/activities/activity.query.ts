import { useQuery, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import type { QueryParams, QueryResult } from "@/layouts/MasterTablePage";
import type { Activity } from "./activity.types";
import { apiFetch } from "@/lib/api/client";
import { buildApiParams } from "@/lib/api/queryUtils";
import type { ApiQueryParams } from "@/lib/api/types";

/**
 * Maps the frontend's generic f.* filter keys to the backend's flat param names.
 * buildApiParams() produces f.module, f.dateRange.from, etc. — the backend
 * expects module, dateFrom, durationMin, etc.
 */
function toActivityBackendParams(p: ApiQueryParams): Record<string, unknown> {
  const out: Record<string, unknown> = {
    page: p.page,
    pageSize: p.pageSize,
  };
  if (p.search)   out.search  = p.search;
  if (p.sortKey)  out.sortKey = p.sortKey;
  if (p.sortDir)  out.sortDir = p.sortDir;
  if (p.cursor)   out.cursor  = p.cursor;

  if (p["f.module"])           out.module      = p["f.module"];
  if (p["f.status"])           out.status      = p["f.status"];
  if (p["f.severity"])         out.severity    = p["f.severity"];
  if (p["f.user"])             out.user        = p["f.user"];
  if (p["f.dateRange.from"])   out.dateFrom    = p["f.dateRange.from"];
  if (p["f.dateRange.to"])     out.dateTo      = p["f.dateRange.to"];
  if (p["f.duration.min"] != null) out.durationMin = p["f.duration.min"];
  if (p["f.duration.max"] != null) out.durationMax = p["f.duration.max"];

  return out;
}

function activitiesKey(params: QueryParams) {
  return ["activities", toActivityBackendParams(buildApiParams(params))] as const;
}

export function useActivitiesQuery(params: QueryParams): QueryResult<Activity> {
  const qc = useQueryClient();
  const backendParams = toActivityBackendParams(buildApiParams(params));

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: activitiesKey(params),
    queryFn: ({ signal }) =>
      apiFetch<Activity>("/api/v1/activities", backendParams as ApiQueryParams, signal),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  if (data?.hasMore) {
    const nextParams: QueryParams = { ...params, page: params.page + 1 };
    const nextBackend = toActivityBackendParams(buildApiParams(nextParams));
    qc.prefetchQuery({
      queryKey: activitiesKey(nextParams),
      queryFn: ({ signal }) =>
        apiFetch<Activity>("/api/v1/activities", nextBackend as ApiQueryParams, signal),
      staleTime: 30_000,
    });
  }

  return {
    data: data?.items ?? [],
    total: data?.total ?? 0,
    totalIsEstimate: data?.totalIsEstimate,
    hasMore: data?.hasMore,
    nextCursor: data?.nextCursor,
    loading: isLoading,
    isFetching,
    error: error?.message ?? null,
    refetch,
  };
}
