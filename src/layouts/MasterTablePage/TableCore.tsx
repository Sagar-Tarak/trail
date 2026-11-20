import { useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ColumnDef, RowAction, Density } from "./types";
import {
  CaretUpOutlined,
  CaretDownOutlined,
  MoreOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const DENSITY_CLASS: Record<Density, string> = {
  compact: "py-1.5",
  default: "py-3",
  comfortable: "py-4",
};

const DENSITY_ROW_HEIGHT: Record<Density, number> = {
  compact: 36,
  default: 48,
  comfortable: 60,
};

function SortIcon({ dir }: { dir: "asc" | "desc" | null }) {
  return (
    <span
      className="ml-1 inline-flex flex-col"
      style={{ fontSize: 8, lineHeight: 1, gap: 1 }}
    >
      <CaretUpOutlined
        style={{ color: dir === "asc" ? "#4f46e5" : "#d1d5db" }}
      />
      <CaretDownOutlined
        style={{ color: dir === "desc" ? "#4f46e5" : "#d1d5db" }}
      />
    </span>
  );
}

function RowActionsMenu<T>({
  record,
  actions,
}: {
  record: T;
  actions: RowAction<T>[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const visible = actions.filter((a) => !a.show || a.show(record));
  if (visible.length === 0) return null;

  // Inline buttons for ≤ 2 actions, dropdown for more
  if (visible.length <= 2) {
    return (
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
        {visible.map((action) => (
          <button
            key={action.key}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(record);
            }}
            title={action.label}
            className={`rounded-md p-1.5 text-xs transition-colors ${
              action.danger
                ? "text-gray-400 hover:bg-red-50 hover:text-red-500"
                : "text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            {action.icon ?? (
              <span className="text-[10px] font-medium">{action.label}</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className="relative flex justify-end"
      ref={ref}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-md p-1 text-gray-400 opacity-0 group-hover/row:opacity-100 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <MoreOutlined className="text-base" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
          {visible.map((action) => (
            <button
              key={action.key}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(record);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-xs transition-colors hover:bg-gray-50 ${
                action.danger ? "text-red-600" : "text-gray-700"
              }`}
            >
              {action.icon && <span className="w-4">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonRows({ cols, rows }: { cols: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b border-gray-50">
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} className="px-4 py-3">
              <div
                className="h-4 animate-pulse rounded-md bg-gray-100"
                style={{ width: `${45 + ((ri * 7 + ci * 13) % 40)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function EmptyRow({
  colSpan,
  icon,
  title,
  description,
  action,
}: {
  colSpan: number;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {icon ?? <FileTextOutlined className="mb-4 text-5xl text-gray-200" />}
          <p className="text-sm font-semibold text-gray-600">
            {title ?? "No results"}
          </p>
          {description && (
            <p className="mt-1 text-xs text-gray-400">{description}</p>
          )}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </td>
    </tr>
  );
}

function getPillRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(total - 1, current + 1);
    p++
  )
    pages.push(p);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  onPageChange: (p: number) => void;
  onPageSizeChange: (ps: number) => void;
}

function Pagination({
  page,
  pageSize,
  total,
  pageSizeOptions = [
    10, 20, 50, 100, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000,
  ],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-4 border-t border-gray-100 px-5 py-3">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>
          {start}–{end} of{" "}
          <span className="font-semibold text-gray-700">
            {total.toLocaleString()}
          </span>
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="ml-1 h-7 rounded-md border border-gray-200 bg-white px-1.5 text-xs text-gray-600 outline-none focus:border-indigo-400"
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        {[
          {
            title: "First",
            icon: "«",
            onClick: () => onPageChange(1),
            disabled: page === 1,
          },
          {
            title: "Prev",
            icon: "‹",
            onClick: () => onPageChange(page - 1),
            disabled: page === 1,
          },
        ].map((btn) => (
          <button
            key={btn.title}
            onClick={btn.onClick}
            disabled={btn.disabled}
            title={btn.title}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors ${
              btn.disabled
                ? "cursor-not-allowed text-gray-200"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {btn.icon}
          </button>
        ))}

        {getPillRange(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1 text-xs text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 text-xs font-medium transition-colors ${
                p === page
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ),
        )}

        {[
          {
            title: "Next",
            icon: "›",
            onClick: () => onPageChange(page + 1),
            disabled: page === totalPages,
          },
          {
            title: "Last",
            icon: "»",
            onClick: () => onPageChange(totalPages),
            disabled: page === totalPages,
          },
        ].map((btn) => (
          <button
            key={btn.title}
            onClick={btn.onClick}
            disabled={btn.disabled}
            title={btn.title}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors ${
              btn.disabled
                ? "cursor-not-allowed text-gray-200"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

interface TableCoreProps<T> {
  data: T[];
  total: number;
  columns: ColumnDef<T>[];
  rowActions?: RowAction<T>[];
  loading?: boolean;
  /** True during background refetch — show subtle overlay instead of full skeleton */
  isFetching?: boolean;
  error?: string | null;
  density?: Density;
  sortKey?: string | null;
  sortDir?: "asc" | "desc" | null;
  onSort?: (key: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (ps: number) => void;
  selectedIds?: Set<string>;
  onToggleRow?: (record: T) => void;
  onToggleAll?: () => void;
  isAllSelected?: boolean;
  isSomeSelected?: boolean;
  getRowKey: (record: T) => string;
  onRowClick?: (record: T) => void;
  emptyState?: {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    action?: React.ReactNode;
  };
  hasDrawer?: boolean;
}

export function TableCore<T extends object>({
  data,
  total,
  columns,
  rowActions = [],
  loading = false,
  isFetching = false,
  error,
  density = "default",
  sortKey,
  sortDir,
  onSort,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  selectedIds = new Set(),
  onToggleRow,
  onToggleAll,
  isAllSelected = false,
  isSomeSelected = false,
  getRowKey,
  onRowClick,
  emptyState,
  hasDrawer = false,
}: TableCoreProps<T>) {
  const hasBulk = !!(onToggleRow && onToggleAll);
  const hasActions = rowActions.length > 0;
  const colCount = columns.length + (hasBulk ? 1 : 0) + (hasActions ? 1 : 0);
  const densityClass = DENSITY_CLASS[density];

  const scrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: loading ? 0 : data.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => DENSITY_ROW_HEIGHT[density],
    overscan: 15,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalVirtualSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalVirtualSize - virtualRows[virtualRows.length - 1].end
      : 0;

  const alignClass = (a?: string) =>
    a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left";

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-16 text-center">
        <ExclamationCircleOutlined className="mb-3 text-4xl text-red-300" />
        <p className="text-sm font-semibold text-red-700">
          Failed to load data
        </p>
        <p className="mt-1 text-xs text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Background refetch indicator — thin progress bar at top */}
      {isFetching && !loading && (
        <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden">
          <div
            className="h-full animate-[slide_1.5s_ease-in-out_infinite] bg-indigo-500"
            style={{ width: "40%" }}
          />
        </div>
      )}
      <div
        ref={scrollRef}
        className="w-full overflow-auto"
        style={{ maxHeight: "calc(100vh - 18rem)" }}
      >
        <table className="w-full min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {hasBulk && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={onToggleAll}
                    className="h-3.5 w-3.5 accent-indigo-600"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap select-none ${alignClass(col.align)} ${
                    col.sortable ? "cursor-pointer hover:text-gray-600" : ""
                  }`}
                  style={{ width: col.width, minWidth: col.minWidth }}
                  onClick={
                    col.sortable && onSort ? () => onSort(col.key) : undefined
                  }
                >
                  <span className="inline-flex items-center gap-0.5">
                    {col.title}
                    {col.sortable && (
                      <SortIcon
                        dir={sortKey === col.key ? (sortDir ?? null) : null}
                      />
                    )}
                  </span>
                </th>
              ))}
              {hasActions && <th className="w-16 px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={colCount} rows={Math.min(pageSize, 15)} />
            ) : data.length === 0 ? (
              <EmptyRow
                colSpan={colCount}
                icon={emptyState?.icon}
                title={emptyState?.title}
                description={emptyState?.description}
                action={emptyState?.action}
              />
            ) : (
              <>
                {paddingTop > 0 && (
                  <tr>
                    <td colSpan={colCount} style={{ height: paddingTop }} />
                  </tr>
                )}
                {virtualRows.map((vRow) => {
                  const record = data[vRow.index];
                  const key = getRowKey(record);
                  const selected = selectedIds.has(key);
                  return (
                    <tr
                      key={key}
                      style={{ height: DENSITY_ROW_HEIGHT[density] }}
                      className={`group/row border-b border-gray-50 transition-colors ${
                        selected ? "bg-indigo-50/40" : "hover:bg-gray-50/70"
                      } ${onRowClick || hasDrawer ? "cursor-pointer" : ""}`}
                      onClick={
                        onRowClick ? () => onRowClick(record) : undefined
                      }
                    >
                      {hasBulk && (
                        <td
                          className="w-10 px-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => onToggleRow?.(record)}
                            className="h-3.5 w-3.5 accent-indigo-600"
                          />
                        </td>
                      )}
                      {columns.map((col) => {
                        const raw =
                          col.dataIndex !== undefined
                            ? (record[col.dataIndex] as unknown)
                            : (record[col.key as keyof T] as unknown);
                        const cell = col.render
                          ? col.render(raw, record)
                          : String(raw ?? "—");
                        return (
                          <td
                            key={col.key}
                            className={`${densityClass} px-4 text-gray-700 ${alignClass(col.align)}`}
                            style={{ width: col.width }}
                          >
                            {cell}
                          </td>
                        );
                      })}
                      {hasActions && (
                        <td
                          className="px-4 py-2 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RowActionsMenu
                            record={record}
                            actions={rowActions}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td colSpan={colCount} style={{ height: paddingBottom }} />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
