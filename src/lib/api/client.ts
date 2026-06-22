import type { ApiPage, ApiError, ApiQueryParams } from "./types";
import { toQueryString } from "./queryUtils";

// mock registry — in production this stays empty and all calls go to real fetch
// in dev you register handlers here instead of spinning up a backend
type MockHandler<T> = (params: ApiQueryParams, signal?: AbortSignal) => Promise<ApiPage<T>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRegistry = new Map<string, MockHandler<any>>();

export function registerMock<T>(route: string, handler: MockHandler<T>) {
  mockRegistry.set(route, handler);
}

// set VITE_API_BASE_URL in .env for production, e.g. https://api.yourapp.com
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

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

async function parseErrorBody(res: Response): Promise<ApiError> {
  try {
    return await res.json();
  } catch {
    return { message: res.statusText || "Unknown error", status: res.status };
  }
}

export async function apiFetch<T>(
  route: string,
  params: ApiQueryParams,
  signal?: AbortSignal
): Promise<ApiPage<T>> {
  // check mock registry first — lets us develop without a running backend
  const mock = mockRegistry.get(route);
  if (mock) {
    return mock(params, signal) as Promise<ApiPage<T>>;
  }

  const url = `${API_BASE}${route}?${toQueryString(params)}`;

  const res = await fetch(url, {
    signal,
    headers: {
      "Content-Type": "application/json",
      // uncomment when auth is wired up:
      // Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!res.ok) {
    const err = await parseErrorBody(res);
    throw new ApiRequestError(res.status, err.code ?? "UNKNOWN", err.message);
  }

  // our backend wraps paginated responses: { statusCode, data, count, paginationMetadata, message }
  // unwrap it into the flat ApiPage shape the frontend expects
  const json = (await res.json()) as Record<string, unknown>;
  if (json.paginationMetadata) {
    const meta = json.paginationMetadata as Record<string, unknown>;
    return {
      items: (json.data ?? []) as T[],
      total: (meta.totalCount ?? meta.total) as number,
      page: (meta.pageNumber ?? meta.page) as number,
      pageSize: (meta.pageSize) as number,
      hasMore: (meta.hasNextPage ?? meta.hasMore) as boolean,
      nextCursor: (meta.nextCursor ?? null) as string | null,
      totalIsEstimate: meta.totalIsEstimate as boolean | undefined,
    };
  }
  return json as unknown as ApiPage<T>;
}
