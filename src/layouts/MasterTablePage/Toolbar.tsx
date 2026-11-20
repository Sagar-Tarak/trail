import { useState, useRef, useEffect, type ReactNode } from "react";
import type { ColumnDef, Density, ToolbarAction } from "./types";
import {
  SearchOutlined,
  FilterOutlined,
  AppstoreOutlined,
  DownloadOutlined,
  ReloadOutlined,
  MenuOutlined,
  BarsOutlined,
  UnorderedListOutlined,
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
  WarningOutlined,
} from "@ant-design/icons";

const DENSITY_OPTIONS: { value: Density; label: string; icon: ReactNode }[] = [
  { value: "compact", label: "Compact", icon: <BarsOutlined /> },
  { value: "default", label: "Default", icon: <UnorderedListOutlined /> },
  { value: "comfortable", label: "Comfortable", icon: <MenuOutlined /> },
];

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  cb: () => void,
) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

interface ColManagerProps<T> {
  columns: ColumnDef<T>[];
  visibility: Record<string, boolean>;
  onChange: (key: string, visible: boolean) => void;
  onToggleAll: (visible: boolean) => void;
}

function ColumnManager<T>({
  columns,
  visibility,
  onChange,
  onToggleAll,
}: ColManagerProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const allVisible = columns.every((c) => visibility[c.key] !== false);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          open
            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        <AppstoreOutlined />
        Columns
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1.5 w-52 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 pb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Columns
            </span>
            <button
              onClick={() => onToggleAll(!allVisible)}
              className="text-[11px] font-medium text-indigo-600 hover:underline"
            >
              {allVisible ? "Hide all" : "Show all"}
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {columns.map((col) => (
              <label
                key={col.key}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={visibility[col.key] !== false}
                  onChange={(e) => onChange(col.key, e.target.checked)}
                  className="h-3.5 w-3.5 accent-indigo-600"
                />
                <span className="text-xs text-gray-700">
                  {col.title as string}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface DensityProps {
  value: Density;
  onChange: (d: Density) => void;
}

function DensitySelector({ value, onChange }: DensityProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const current = DENSITY_OPTIONS.find((d) => d.value === value)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Row density"
        className={`flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-sm transition-colors ${
          open
            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
            : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
        }`}
      >
        {current.icon}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1.5 w-40 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl">
          {DENSITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-gray-50 ${
                value === opt.value
                  ? "font-semibold text-indigo-600"
                  : "text-gray-700"
              }`}
            >
              <span className="text-sm">{opt.icon}</span>
              {opt.label}
              {value === opt.value && (
                <CheckOutlined className="ml-auto text-xs text-indigo-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ToolbarProps<T> {
  searchInput: string;
  onSearch: (s: string) => void;
  placeholder?: string;
  activeFilterCount: number;
  onToggleFilters: () => void;
  isFilterPanelOpen: boolean;
  columns: ColumnDef<T>[];
  columnVisibility: Record<string, boolean>;
  onColumnChange: (key: string, visible: boolean) => void;
  onToggleAllColumns: (visible: boolean) => void;
  density: Density;
  onDensityChange: (d: Density) => void;
  onExport: () => void;
  onRefresh: () => void;
  toolbarActions?: ToolbarAction[];
  canExport?: boolean;
  total: number;
}

export function Toolbar<T>({
  searchInput,
  onSearch,
  placeholder = "Search…",
  activeFilterCount,
  onToggleFilters,
  isFilterPanelOpen,
  columns,
  columnVisibility,
  onColumnChange,
  onToggleAllColumns,
  density,
  onDensityChange,
  onExport,
  onRefresh,
  toolbarActions = [],
  canExport = true,
}: ToolbarProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-gray-400">
          <SearchOutlined className="text-sm" />
        </span>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30"
        />
        {searchInput && (
          <button
            onClick={() => onSearch("")}
            className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
          >
            <CloseOutlined className="text-xs" />
          </button>
        )}
      </div>

      {/* Filters */}
      <button
        onClick={onToggleFilters}
        className={`relative flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          isFilterPanelOpen || activeFilterCount > 0
            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        <FilterOutlined />
        Filters
        {activeFilterCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Columns */}
      <ColumnManager
        columns={columns}
        visibility={columnVisibility}
        onChange={onColumnChange}
        onToggleAll={onToggleAllColumns}
      />

      {/* Density */}
      <DensitySelector value={density} onChange={onDensityChange} />

      {/* Divider */}
      <div className="h-6 w-px bg-gray-200" />

      {/* Refresh */}
      <button
        onClick={onRefresh}
        title="Refresh"
        className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
      >
        <ReloadOutlined className="text-sm" />
      </button>

      {/* Export */}
      {canExport && (
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
        >
          <DownloadOutlined />
          Export
        </button>
      )}

      {/* Custom toolbar actions */}
      {toolbarActions.map((action) => (
        <button
          key={action.key}
          onClick={action.onClick}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            action.variant === "primary"
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              : action.variant === "danger"
                ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {action.icon ??
            (action.variant === "primary" ? (
              <PlusOutlined />
            ) : (
              <WarningOutlined />
            ))}
          {action.label}
        </button>
      ))}
    </div>
  );
}
