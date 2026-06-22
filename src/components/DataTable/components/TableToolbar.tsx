import type { ReactNode } from "react";
import { SearchInput } from "./SearchInput";
import { ColumnDropdown } from "./ColumnDropdown";
import { DensityDropdown } from "./DensityDropdown";
import { ExportDropdown } from "./ExportDropdown";
import type { DataTableContext } from "../types/data-table.types";
import type { ActiveFilter } from "../types/data-table.types";

interface TableToolbarProps<TData> {
  ctx: DataTableContext<TData>;
  searchable: boolean;
  filterable: boolean;
  exportable: boolean;
  actions?: ReactNode;
  activeFilters?: ActiveFilter[];
  onFiltersOpen: () => void;
  onFilterRemove?: (key: string) => void;
  onResetFilters?: () => void;
  tableId: string;
  filename?: string;
}

export function TableToolbar<TData>({
  ctx,
  searchable,
  filterable,
  exportable,
  actions,
  activeFilters = [],
  onFiltersOpen,
  onFilterRemove,
  onResetFilters,
  filename,
}: TableToolbarProps<TData>) {
  const { table, globalSearch, setGlobalSearch, density, setDensity, selectedRows } = ctx;
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="flex flex-col gap-0">
      {/* Main toolbar row */}
      <div className="flex items-center gap-2 border-b border-[#E8EAED] bg-[#FAFAFB] px-4 py-2.5">
        {/* Left: search + filter badges */}
        <div className="flex flex-1 items-center gap-2 flex-wrap min-w-0">
          {searchable && (
            <SearchInput
              value={globalSearch}
              onChange={setGlobalSearch}
              placeholder="Search records..."
            />
          )}

          {filterable && (
            <button
              onClick={onFiltersOpen}
              aria-label="Open filters"
              className={`dt-toolbar-btn ${hasActiveFilters ? "border-blue-300 text-blue-600 bg-blue-50" : ""}`}
            >
              <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591L15.75 12.8V20.25a.75.75 0 0 1-1.11.664l-3-1.5A.75.75 0 0 1 11.25 18.75v-5.95L4.659 7.409A2.25 2.25 0 0 1 4 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
              </svg>
              Filters
              {hasActiveFilters && (
                <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold text-white">
                  {activeFilters.length}
                </span>
              )}
            </button>
          )}

          {/* Active filter badges */}
          {activeFilters.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700"
            >
              <span className="text-blue-400">{f.label}:</span>
              <span className="font-medium">{f.value}</span>
              {onFilterRemove && (
                <button
                  onClick={() => onFilterRemove(f.key)}
                  aria-label={`Remove ${f.label} filter`}
                  className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-blue-100 text-blue-400 hover:text-blue-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-2.5 w-2.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </span>
          ))}

          {hasActiveFilters && onResetFilters && (
            <button
              onClick={onResetFilters}
              className="text-[11px] text-gray-400 underline hover:text-gray-600 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Right: column controls + export + custom actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ColumnDropdown table={table} />
          <DensityDropdown value={density} onChange={setDensity} />

          {exportable && (
            <ExportDropdown
              table={table}
              filename={filename}
              hasSelection={selectedRows.length > 0}
            />
          )}

          {/* Refresh */}
          <button
            onClick={() => ctx.query.refetch()}
            aria-label="Refresh table data"
            className="dt-toolbar-btn-icon"
            title="Refresh"
          >
            <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {actions && (
            <>
              <div className="mx-1 h-4 w-px bg-[#E8EAED]" aria-hidden="true" />
              <div className="flex items-center gap-1.5">{actions}</div>
            </>
          )}
        </div>
      </div>

      {/* Bulk action bar (shows when rows selected) */}
      {ctx.selectedRows.length > 0 && (
        <div className="flex items-center gap-3 border-b border-blue-100 bg-blue-50 px-4 py-2">
          <span className="text-xs font-medium text-blue-700">
            {ctx.selectedRows.length} row{ctx.selectedRows.length !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={ctx.clearSelection}
            className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
