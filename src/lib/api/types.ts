export interface ApiPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor: string | null;
  totalIsEstimate?: boolean;
}

export interface ApiQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  cursor?: string;
  [key: string]: unknown;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
