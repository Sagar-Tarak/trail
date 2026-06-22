import type { Table } from "@tanstack/react-table";
import { DEFAULT_PAGE_SIZE_OPTIONS } from "../constants";

interface TablePaginationProps<TData> {
  table: Table<TData>;
  total: number;
  pageSizeOptions?: number[];
  isFetching?: boolean;
}

export function TablePagination<TData>({
  table,
  total,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  isFetching,
}: TablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  // Build page number windows: [1] … [cur-1, cur, cur+1] … [last]
  const pages = buildPageWindow(pageIndex + 1, pageCount);

  return (
    <div className="flex items-center justify-between border-t border-[#E8EAED] bg-[#FAFAFB] px-4 py-2.5">
      {/* Left: record count */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-gray-500">
          {total === 0 ? "No records" : `${from}–${to} of ${total.toLocaleString()}`}
        </span>
        {isFetching && (
          <span className="h-3 w-3 animate-spin rounded-full border border-gray-200 border-t-blue-400" aria-label="Loading" role="status" />
        )}
      </div>

      {/* Right: page size + nav */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-400">Rows</span>
        <select
          value={pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          aria-label="Rows per page"
          className="h-7 rounded-lg border border-[#E8EAED] bg-white px-2 text-[11px] text-gray-700 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100"
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Prev */}
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
          className="dt-page-btn disabled:opacity-30"
        >
          <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-[11px] text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => table.setPageIndex((p as number) - 1)}
              aria-label={`Page ${p}`}
              aria-current={p === pageIndex + 1 ? "page" : undefined}
              className={`dt-page-btn min-w-[28px] ${
                p === pageIndex + 1
                  ? "border-blue-300 bg-blue-50 font-medium text-blue-600"
                  : ""
              }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
          className="dt-page-btn disabled:opacity-30"
        >
          <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function buildPageWindow(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const result: (number | "...")[] = [];
  const showLeft = current > 3;
  const showRight = current < total - 2;

  result.push(1);
  if (showLeft) result.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) result.push(i);

  if (showRight) result.push("...");
  result.push(total);

  return result;
}
