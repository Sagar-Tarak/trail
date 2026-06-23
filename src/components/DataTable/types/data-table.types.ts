import type {
  ColumnDef,
  Table,
  Row,
} from "@tanstack/react-table";
import type { ReactNode } from "react";

export type DensityMode = "compact" | "comfortable";

export type ExportScope = "current-page" | "selected" | "filtered-all";
export type ExportFormat = "csv" | "excel" | "json";

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

export interface DataTableQueryResult<TData> {
  data?: {
    rows: TData[];
    total: number;
  };
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

export interface DataTableColumnMeta {
  /** Column hidden from visibility toggle (e.g. checkbox col) */
  system?: boolean;
  /** Short label for toolbar */
  label?: string;
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  query: DataTableQueryResult<TData>;
  rowKey: keyof TData & string;
  searchable?: boolean;
  selectable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  selectionMode?: "checkbox" | "radio";
  actions?: ReactNode;
  filters?: Record<string, unknown>;
  activeFilters?: ActiveFilter[];
  onFiltersChange?: (filters: Record<string, unknown>) => void;
  onFilterRemove?: (key: string) => void;
  filterDrawerContent?: (props: {
    filters: Record<string, unknown>;
    onChange: (filters: Record<string, unknown>) => void;
    onClose: () => void;
  }) => ReactNode;
  onRowClick?: (row: Row<TData>) => void;
  bulkActions?: (props: {
    selectedRows: Row<TData>[];
    clearSelection: () => void;
  }) => ReactNode;
  pageSizeOptions?: number[];
  zebraRows?: boolean;
  tableId?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export interface DataTableContext<TData> {
  table: Table<TData>;
  query: DataTableQueryResult<TData>;
  density: DensityMode;
  setDensity: (d: DensityMode) => void;
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
  zebraRows: boolean;
  selectable: boolean;
  selectionMode: "checkbox" | "radio";
  rowKey: string;
  onRowClick?: (row: Row<TData>) => void;
  selectedRows: Row<TData>[];
  clearSelection: () => void;
  /** IDs of currently visible data columns (excludes system cols like selection). Pass to API to limit fields returned. */
  visibleColumnIds: string[];
}
