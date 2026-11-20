import { useState, useMemo, type ReactNode } from "react";
import {
  CaretUpOutlined,
  CaretDownOutlined,
  SearchOutlined,
  FileTextOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";

export type SortDir = "asc" | "desc" | null;

export interface TableColumn<T> {
  key: string;
  title: ReactNode;
  /** field on T to read, defaults to `key` */
  dataIndex?: keyof T;
  /** custom render, takes precedence over dataIndex */
  render?: (value: unknown, record: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
  /** used for client-side search */
  searchable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  rowKey: keyof T | ((record: T) => string);
  /** Show search bar */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Default page size */
  pageSize?: number;
  pageSizeOptions?: number[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  /** Controls rendered top-right of table header */
  actions?: ReactNode;
  onRowClick?: (record: T) => void;
  emptyText?: string;
  /** Removes card wrapper — use inside an existing card */
  bare?: boolean;
  /** Highlight row on hover */
  rowHover?: boolean;
  /** Extra class on the outer wrapper */
  className?: string;
}

function getKey<T>(record: T, rowKey: DataTableProps<T>["rowKey"]): string {
  return typeof rowKey === "function" ? rowKey(record) : String(record[rowKey]);
}

function getValue<T>(record: T, col: TableColumn<T>): unknown {
  const field = (col.dataIndex ?? col.key) as keyof T;
  return record[field];
}

function searchRecord<T>(
  record: T,
  columns: TableColumn<T>[],
  query: string,
): boolean {
  const q = query.toLowerCase();
  for (const col of columns) {
    if (!col.searchable) continue;
    const v = getValue(record, col);
    if (v != null && String(v).toLowerCase().includes(q)) return true;
  }
  return false;
}

function SortIcon({ dir }: { dir: SortDir }) {
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

function EmptyState({ text }: { text: string }) {
  return (
    <tr>
      <td colSpan={999}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileTextOutlined className="mb-3 text-4xl text-gray-200" />
          <p className="text-sm text-gray-400">{text}</p>
        </div>
      </td>
    </tr>
  );
}

function SkeletonRows({ columns, rows }: { columns: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b border-gray-50">
          {Array.from({ length: columns }).map((_, ci) => (
            <td key={ci} className="px-4 py-3">
              <div
                className="h-4 animate-pulse rounded bg-gray-100"
                style={{ width: `${50 + Math.random() * 40}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchable = false,
  searchPlaceholder = "Search…",
  pageSize: defaultPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  loading = false,
  title,
  subtitle,
  actions,
  onRowClick,
  emptyText = "No data found",
  bare = false,
  rowHover = true,
  className = "",
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
    setPage(1);
  };

  const processed = useMemo(() => {
    let rows = [...data];

    // Search
    if (searchable && query.trim()) {
      rows = rows.filter((r) => searchRecord(r, columns, query));
    }

    // Sort
    if (sortKey && sortDir) {
      const col = columns.find((c) => c.key === sortKey);
      rows.sort((a, b) => {
        const av = col
          ? getValue(a, col)
          : (a as Record<string, unknown>)[sortKey];
        const bv = col
          ? getValue(b, col)
          : (b as Record<string, unknown>)[sortKey];
        const cmp = String(av ?? "").localeCompare(
          String(bv ?? ""),
          undefined,
          { numeric: true },
        );
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return rows;
  }, [data, query, sortKey, sortDir, columns, searchable]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageData = processed.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const alignClass = (a?: string) =>
    a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left";

  const inner = (
    <>
      {/* ── Header ── */}
      {(title || subtitle || searchable || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-4 min-w-0">
            {(title || subtitle) && (
              <div>
                {title && (
                  <h3 className="text-sm font-semibold text-gray-800">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
                )}
              </div>
            )}
            {searchable && (
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-gray-400">
                  <SearchOutlined className="text-sm" />
                </span>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 w-52 rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-indigo-400 focus:bg-white transition"
                />
              </div>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 ${alignClass(col.align)} whitespace-nowrap select-none ${col.sortable ? "cursor-pointer hover:text-gray-700" : ""}`}
                  style={{ width: col.width }}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {col.title}
                    {col.sortable && (
                      <SortIcon dir={sortKey === col.key ? sortDir : null} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows columns={columns.length} rows={pageSize} />
            ) : pageData.length === 0 ? (
              <EmptyState text={emptyText} />
            ) : (
              pageData.map((record, ri) => (
                <tr
                  key={getKey(record, rowKey)}
                  onClick={onRowClick ? () => onRowClick(record) : undefined}
                  className={[
                    "border-b border-gray-50 transition-colors",
                    rowHover ? "hover:bg-gray-50/70" : "",
                    onRowClick ? "cursor-pointer" : "",
                  ].join(" ")}
                >
                  {columns.map((col) => {
                    const raw = getValue(record, col);
                    const cell = col.render
                      ? col.render(raw, record, ri)
                      : String(raw ?? "—");
                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-gray-700 ${alignClass(col.align)}`}
                        style={{ width: col.width }}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {!loading && processed.length > 0 && (
        <div className="flex items-center justify-between gap-4 border-t border-gray-100 px-5 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              {(safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, processed.length)} of{" "}
              <span className="font-medium text-gray-700">
                {processed.length}
              </span>
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
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
            <PaginationBtn
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              title="First"
            >
              <DoubleLeftOutlined />
            </PaginationBtn>
            <PaginationBtn
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              title="Previous"
            >
              <LeftOutlined />
            </PaginationBtn>

            {/* Page pills */}
            {getPillRange(safePage, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-1 text-xs text-gray-400">
                  …
                </span>
              ) : (
                <PaginationBtn
                  key={p}
                  onClick={() => setPage(p as number)}
                  active={p === safePage}
                >
                  {p}
                </PaginationBtn>
              ),
            )}

            <PaginationBtn
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              title="Next"
            >
              <RightOutlined />
            </PaginationBtn>
            <PaginationBtn
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              title="Last"
            >
              <DoubleRightOutlined />
            </PaginationBtn>
          </div>
        </div>
      )}
    </>
  );

  if (bare) return <div className={className}>{inner}</div>;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {inner}
    </div>
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

function PaginationBtn({
  onClick,
  disabled,
  active,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        "flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : disabled
            ? "cursor-not-allowed text-gray-300"
            : "text-gray-600 hover:bg-gray-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
