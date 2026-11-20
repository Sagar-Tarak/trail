import { useQuery, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import type { QueryParams, QueryResult } from "@/layouts/MasterTablePage";
import type { User } from "./user.types";
import { apiFetch } from "@/lib/api/client";
import { buildApiParams } from "@/lib/api/queryUtils";
import type { ApiQueryParams } from "@/lib/api/types";

/**
 * Maps frontend f.* filter keys to backend flat param names for the users endpoint.
 */
function toUserBackendParams(p: ApiQueryParams): Record<string, unknown> {
  const out: Record<string, unknown> = {
    page: p.page,
    pageSize: p.pageSize,
  };
  if (p.search) out.search = p.search;
  if (p.sortKey) out.sortKey = p.sortKey;
  if (p.sortDir) out.sortDir = p.sortDir;
  if (p.cursor) out.cursor = p.cursor;

  if (p["f.status"]) out.status = p["f.status"];
  if (p["f.role"]) out.role = p["f.role"];
  if (p["f.module"]) out.module = p["f.module"];
  if (p["f.mfaEnabled"] != null) out.mfaEnabled = p["f.mfaEnabled"];
  if (p["f.eventCount.min"] != null) out.eventCountMin = p["f.eventCount.min"];
  if (p["f.eventCount.max"] != null) out.eventCountMax = p["f.eventCount.max"];

  return out;
}

function usersKey(params: QueryParams) {
  return ["users", toUserBackendParams(buildApiParams(params))] as const;
}

export function useUsersQuery(params: QueryParams): QueryResult<User> {
  const qc = useQueryClient();
  const backendParams = toUserBackendParams(buildApiParams(params));

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: usersKey(params),
    queryFn: ({ signal }) =>
      apiFetch<User>("/api/v1/users", backendParams as ApiQueryParams, signal),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  if (data?.hasMore) {
    const nextParams: QueryParams = { ...params, page: params.page + 1 };
    const nextBackend = toUserBackendParams(buildApiParams(nextParams));
    qc.prefetchQuery({
      queryKey: usersKey(nextParams),
      queryFn: ({ signal }) =>
        apiFetch<User>("/api/v1/users", nextBackend as ApiQueryParams, signal),
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
