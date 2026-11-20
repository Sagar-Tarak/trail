import { useState, useCallback, useMemo, useRef } from "react";
import type { DataTableProps } from "./types/data-table.types";
import { useDataTable } from "./hooks/useDataTable";
import { TableToolbar } from "./components/TableToolbar";
import { TableHeader } from "./components/TableHeader";
import { TableBody } from "./components/TableBody";
import { TableLoading } from "./components/TableLoading";
import { TableEmpty } from "./components/TableEmpty";
import { TablePagination } from "./components/TablePagination";
import { FilterDrawer } from "./components/FilterDrawer";

export function DataTable<TData>(props: DataTableProps<TData>) {
  const {
    searchable = false,
    filterable = false,
    exportable = false,
    actions,
    filters = {},
    activeFilters = [],
    onFiltersChange,
    onFilterRemove,
    filterDrawerContent,
    bulkActions,
    pageSizeOptions,
    emptyStateTitle,
    emptyStateDescription,
    tableId = "default",
  } = props;

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const openFilters = useCallback(() => setFilterDrawerOpen(true), []);
  const closeFilters = useCallback(() => setFilterDrawerOpen(false), []);

  const handleFiltersChange = useCallback(
    (next: Record<string, unknown>) => {
      onFiltersChange?.(next);
    },
    [onFiltersChange],
  );

  const handleResetFilters = useCallback(() => {
    onFiltersChange?.({});
  }, [onFiltersChange]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const ctx = useDataTable(props);
  const { table, query, density } = ctx;

  const visibleColCount = table.getVisibleLeafColumns().length;
  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;

  // derive which state to show — order matters, loading takes priority
  const showLoading = query.isLoading;
  const showError = !query.isLoading && query.isError;
  const showEmpty = !query.isLoading && !query.isError && rows.length === 0;
  const showData = !query.isLoading && !query.isError && rows.length > 0;

  // memoized so bulk bar doesn't re-render every time unrelated table state changes
  const bulkBar = useMemo(() => {
    if (!bulkActions || ctx.selectedRows.length === 0) return null;
    return bulkActions({
      selectedRows: ctx.selectedRows,
      clearSelection: ctx.clearSelection,
    });
  }, [bulkActions, ctx.selectedRows, ctx.clearSelection]);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#E8EAED] bg-white shadow-sm">
      <TableToolbar
        ctx={ctx}
        searchable={searchable}
        filterable={filterable}
        exportable={exportable}
        actions={actions}
        activeFilters={activeFilters}
        onFiltersOpen={openFilters}
        onFilterRemove={onFilterRemove}
        onResetFilters={handleResetFilters}
        tableId={tableId}
        filename={tableId}
      />

      {bulkBar && (
        <div className="border-b border-[#E8EAED] bg-blue-50 px-4 py-2">
          {bulkBar}
        </div>
      )}

      <div ref={scrollRef} className="overflow-auto">
        <table
          className="w-full table-auto border-collapse"
          aria-label="Data table"
          aria-rowcount={total}
          aria-busy={query.isLoading || query.isFetching}
        >
          <TableHeader table={table} density={density} />

          {showLoading && (
            <TableLoading colCount={visibleColCount} density={density} />
          )}
          {showError && (
            <TableEmpty
              colCount={visibleColCount}
              isError
              onRetry={query.refetch}
            />
          )}
          {showEmpty && (
            <TableEmpty
              colCount={visibleColCount}
              title={emptyStateTitle}
              description={emptyStateDescription}
            />
          )}
          {showData && <TableBody ctx={ctx} scrollRef={scrollRef} />}
        </table>
      </div>

      <TablePagination
        table={table}
        total={total}
        pageSizeOptions={pageSizeOptions}
        isFetching={query.isFetching && !query.isLoading}
      />

      {filterable && filterDrawerContent && (
        <FilterDrawer open={filterDrawerOpen} onClose={closeFilters}>
          {filterDrawerContent({
            filters,
            onChange: handleFiltersChange,
            onClose: closeFilters,
          })}
        </FilterDrawer>
      )}
    </div>
  );
}
