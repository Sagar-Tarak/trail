import { useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type VisibilityState,
  type ColumnPinningState,
  type PaginationState,
  type Row,
} from "@tanstack/react-table";
import { useTableStore } from "../../../store/useTableStore";
import { useTablePersistence } from "./useTablePersistence";
import type {
  DataTableProps,
  DataTableContext,
  DensityMode,
} from "../types/data-table.types";
import { DEFAULT_PAGE_SIZE } from "../constants";
import { createSelectionColumn } from "../utils/selectionColumn";

export function useDataTable<TData>(
  props: DataTableProps<TData>
): DataTableContext<TData> {
  const {
    columns,
    query,
    rowKey,
    selectable = false,
    selectionMode = "checkbox",
    zebraRows: zebraRowsProp,
    tableId = "default",
  } = props;

  const prefs = useTableStore((s) => s.getPrefs(tableId));
  const setDensityInStore = useTableStore((s) => s.setDensity);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalSearch, setGlobalSearch] = useState("");

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    prefs.columnVisibility
  );
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    prefs.columnPinning
  );
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: prefs.pageSize ?? DEFAULT_PAGE_SIZE,
  });

  // density is in redux so it persists when you switch between tables
  const density = prefs.density;
  const zebraRows = zebraRowsProp ?? prefs.zebraRows;

  const handleSetDensity = useCallback(
    (d: DensityMode) => {
      setDensityInStore(tableId, d);
    },
    [setDensityInStore, tableId]
  );

  // checkbox column always goes first if selection is enabled
  const allColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
    if (!selectable) return columns;
    return [
      createSelectionColumn<TData>(selectionMode) as ColumnDef<TData, unknown>,
      ...columns,
    ];
  }, [columns, selectable, selectionMode]);

  const rows = useMemo(() => query.data?.rows ?? [], [query.data?.rows]);
  const total = query.data?.total ?? 0;

  const table = useReactTable<TData>({
    data: rows,
    columns: allColumns,
    state: {
      sorting,
      rowSelection,
      globalFilter: globalSearch,
      columnVisibility,
      columnPinning,
      pagination,
    },
    // everything is server-side — tanstack table doesn't touch the data, just manages UI state
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil(total / pagination.pageSize),
    enableRowSelection: selectable,
    enableMultiRowSelection: selectionMode === "checkbox",
    getRowId: (row) => String(row[rowKey as keyof TData]),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalSearch,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useTablePersistence(table, tableId);

  // rowSelection in deps because table.getSelectedRowModel() reads internal state
  // that doesn't trigger re-renders on its own
  const selectedRows = useMemo<Row<TData>[]>(
    () => table.getSelectedRowModel().rows,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rowSelection, table]
  );

  const clearSelection = useCallback(() => {
    setRowSelection({});
  }, []);

  return {
    table,
    query,
    density,
    setDensity: handleSetDensity,
    globalSearch,
    setGlobalSearch,
    zebraRows,
    selectable,
    selectionMode,
    rowKey,
    onRowClick: props.onRowClick,
    selectedRows,
    clearSelection,
  };
}
