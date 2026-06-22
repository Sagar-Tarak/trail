import type { ReactNode } from "react";

export type Density = "compact" | "default" | "comfortable";
export type SortDir = "asc" | "desc" | null;

export type FilterType =
  | "text"
  | "select"
  | "multi-select"
  | "date"
  | "date-range"
  | "boolean"
  | "number-range";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterDef {
  key: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  placeholder?: string;
  icon?: ReactNode;
}

export interface ColumnDef<T> {
  key: string;
  title: ReactNode;
  dataIndex?: keyof T;
  render?: (value: unknown, record: T) => ReactNode;
  sortable?: boolean;
  width?: number | string;
  minWidth?: number;
  align?: "left" | "center" | "right";
  /** true by default */
  defaultVisible?: boolean;
  pin?: "left" | "right";
}

export interface RowAction<T> {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: (record: T) => void;
  show?: (record: T) => boolean;
  danger?: boolean;
}

export interface ToolbarAction {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "primary" | "default" | "danger";
}

export interface BulkAction<T> {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: (selected: T[]) => void;
  danger?: boolean;
  show?: (selected: T[]) => boolean;
}

export interface DrawerDef<T> {
  component: React.ComponentType<{ record: T; onClose: () => void }>;
  width?: number | string;
  title?: (record: T) => string;
}

export interface Permissions {
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
  export?: boolean;
  bulkDelete?: boolean;
}

export interface EmptyStateDef {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export interface QueryParams {
  page: number;
  pageSize: number;
  search: string;
  filters: Record<string, unknown>;
  sortKey: string | null;
  sortDir: SortDir;
  /** Opaque cursor for the next page — set by server, passed back on next request */
  cursor?: string | null;
}

export interface QueryResult<T> {
  data: T[];
  /** Total matching rows — may be an estimate on very large datasets */
  total: number;
  totalIsEstimate?: boolean;
  /** True when there is a next page (used with cursor pagination) */
  hasMore?: boolean;
  nextCursor?: string | null;
  /** True on initial load (no data yet) — show skeleton */
  loading: boolean;
  /** True during background refetch (data exists) — show subtle indicator */
  isFetching?: boolean;
  error?: string | null;
  refetch: () => void;
}

export interface SavedView {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  columnVisibility: Record<string, boolean>;
  sortKey: string | null;
  sortDir: SortDir;
  search: string;
}

export interface MasterTableConfig<T extends object> {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  breadcrumbs?: Array<{ label: string }>;
  /** Unique field or fn returning string key per row */
  rowKey: keyof T | ((record: T) => string);
  columns: ColumnDef<T>[];
  filters?: FilterDef[];
  rowActions?: RowAction<T>[];
  toolbarActions?: ToolbarAction[];
  bulkActions?: BulkAction<T>[];
  drawer?: DrawerDef<T>;
  permissions?: Permissions;
  /** localStorage key — must be unique per page */
  persistenceKey: string;
  /** Hook that receives QueryParams and returns QueryResult<T> */
  queryHook: (params: QueryParams) => QueryResult<T>;
  emptyState?: EmptyStateDef;
  searchPlaceholder?: string;
  defaultPageSize?: number;
  defaultDensity?: Density;
}
