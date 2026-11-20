import {
  companyScopeParams,
  useCompanyScopeStore,
} from "@/store/useCompanyScopeStore";
import { useAuthStore } from "@/store/useAuthStore";
import axios, { AxiosError, type AxiosInstance } from "axios";
import type { ApiPage, ApiError, ApiQueryParams } from "./types";
import { toQueryString } from "./queryUtils";

// set VITE_API_BASE_URL in .env for production, e.g. https://api.yourapp.com
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "/trio-trail/api/v1";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().tokens?.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const path = (config.url ?? "").split("?")[0];
  if (
    /^\/audit-(?:log|events)(?:\/|$)/.test(path) &&
    path !== "/audit-log/companies"
  ) {
    const tenantId = useAuthStore.getState().tenant?.id ?? "";
    const scope = companyScopeParams(
      useCompanyScopeStore.getState().selections[tenantId],
    );
    config.params = { ...config.params, ...scope };
  }
  return config;
});

// Centralised response error → ApiRequestError conversion
apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiError>) => {
    const status = err.response?.status ?? 0;
    const body = err.response?.data;
    if (
      (status === 401 || status === 777) &&
      !err.config?.url?.includes("/auth/log-in") &&
      err.config?.headers?.Authorization ===
        `Bearer ${useAuthStore.getState().tokens?.accessToken}`
    )
      useAuthStore.getState().clear();
    const code = body?.code ?? "UNKNOWN";
    const fieldErrors = Array.isArray(body?.fieldErrors)
      ? body.fieldErrors
          .filter((field) => field && typeof field.message === "string")
          .map((field) => `${field.path || "Request"}: ${field.message}`)
          .join("; ")
      : "";
    const message =
      status === 0
        ? "Cannot reach the API. Check that the backend is running and the API URL is correct."
        : fieldErrors
          ? `${body?.message ?? "Validation failed"}: ${fieldErrors}`
          : (body?.message ??
            ([502, 503, 504].includes(status)
              ? "The backend service is unavailable. Check that it is running, then retry."
              : (err.message ?? "Unknown error")));
    return Promise.reject(new ApiRequestError(status, code, message));
  },
);

export async function apiFetch<T>(
  route: string,
  params: ApiQueryParams,
  signal?: AbortSignal,
): Promise<ApiPage<T>> {
  const { data: json } = await apiClient.get<Record<string, unknown>>(
    `${route}?${toQueryString(params)}`,
    { signal },
  );

  // our backend wraps paginated responses: { statusCode, data, count, paginationMetadata, message }
  // unwrap it into the flat ApiPage shape the frontend expects
  if (json.paginationMetadata) {
    const meta = json.paginationMetadata as Record<string, unknown>;
    return {
      items: (json.data ?? []) as T[],
      total: (meta.totalCount ?? meta.total) as number,
      page: (meta.pageNumber ?? meta.page) as number,
      pageSize: meta.pageSize as number,
      hasMore: (meta.hasNextPage ?? meta.hasMore) as boolean,
      nextCursor: (meta.nextCursor ?? null) as string | null,
      totalIsEstimate: meta.totalIsEstimate as boolean | undefined,
    };
  }
  return json as unknown as ApiPage<T>;
}
