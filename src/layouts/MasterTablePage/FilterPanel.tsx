import { useEffect } from "react";
import type { FilterDef } from "./types";

function TextFilter({
  def,
  value,
  onChange,
}: {
  def: FilterDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <input
      type="text"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder={def.placeholder ?? `Filter by ${def.label.toLowerCase()}…`}
      className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs text-gray-700 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:bg-white"
    />
  );
}

function SelectFilter({
  def,
  value,
  onChange,
}: {
  def: FilterDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <select
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs text-gray-700 outline-none transition focus:border-indigo-400 focus:bg-white"
    >
      <option value="">All</option>
      {def.options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function MultiSelectFilter({
  def,
  value,
  onChange,
}: {
  def: FilterDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const selected = Array.isArray(value) ? (value as string[]) : [];

  const toggle = (v: string) => {
    const next = selected.includes(v)
      ? selected.filter((s) => s !== v)
      : [...selected, v];
    onChange(next.length ? next : null);
  };

  return (
    <div className="space-y-1.5">
      {def.options?.map((opt) => (
        <label
          key={opt.value}
          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-indigo-50/60 transition-colors"
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            className="h-3.5 w-3.5 accent-indigo-600"
          />
          <span className="text-xs text-gray-700">{opt.label}</span>
          {selected.includes(opt.value) && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
          )}
        </label>
      ))}
    </div>
  );
}

function DateFilter({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <input
      type="date"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs text-gray-700 outline-none transition focus:border-indigo-400 focus:bg-white"
    />
  );
}

function DateRangeFilter({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const range =
    value && typeof value === "object"
      ? (value as { from?: string; to?: string })
      : {};

  const update = (field: "from" | "to", v: string) => {
    const next = { ...range, [field]: v || undefined };
    onChange(Object.values(next).some(Boolean) ? next : null);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
          From
        </p>
        <input
          type="date"
          value={range.from ?? ""}
          onChange={(e) => update("from", e.target.value)}
          className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-xs text-gray-700 outline-none focus:border-indigo-400"
        />
      </div>
      <div>
        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
          To
        </p>
        <input
          type="date"
          value={range.to ?? ""}
          onChange={(e) => update("to", e.target.value)}
          className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-xs text-gray-700 outline-none focus:border-indigo-400"
        />
      </div>
    </div>
  );
}

function BooleanFilter({
  value,
  onChange,
}: {
  def?: FilterDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <div className="flex gap-2">
      {[
        { label: "Any", v: null },
        { label: "Yes", v: true },
        { label: "No", v: false },
      ].map((opt) => (
        <button
          key={String(opt.label)}
          onClick={() => onChange(opt.v)}
          className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${
            value === opt.v || (opt.v === null && value == null)
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function NumberRangeFilter({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const range =
    value && typeof value === "object"
      ? (value as { min?: number; max?: number })
      : {};

  const update = (field: "min" | "max", v: string) => {
    const num = v ? Number(v) : undefined;
    const next = { ...range, [field]: num };
    onChange(Object.values(next).some((x) => x !== undefined) ? next : null);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <input
        type="number"
        placeholder="Min"
        value={range.min ?? ""}
        onChange={(e) => update("min", e.target.value)}
        className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs outline-none focus:border-indigo-400"
      />
      <input
        type="number"
        placeholder="Max"
        value={range.max ?? ""}
        onChange={(e) => update("max", e.target.value)}
        className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs outline-none focus:border-indigo-400"
      />
    </div>
  );
}

function FilterInput({
  def,
  value,
  onChange,
}: {
  def: FilterDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (def.type) {
    case "text":
      return <TextFilter def={def} value={value} onChange={onChange} />;
    case "select":
      return <SelectFilter def={def} value={value} onChange={onChange} />;
    case "multi-select":
      return <MultiSelectFilter def={def} value={value} onChange={onChange} />;
    case "date":
      return <DateFilter value={value} onChange={onChange} />;
    case "date-range":
      return <DateRangeFilter value={value} onChange={onChange} />;
    case "boolean":
      return <BooleanFilter value={value} onChange={onChange} />;
    case "number-range":
      return <NumberRangeFilter value={value} onChange={onChange} />;
    default:
      return null;
  }
}

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: FilterDef[];
  values: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
  onClearAll: () => void;
  activeCount: number;
}

export function FilterPanel({
  open,
  onClose,
  filters,
  values,
  onFilterChange,
  onClearAll,
  activeCount,
}: FilterPanelProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-black/10 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel — slides from left */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
            {activeCount > 0 && (
              <p className="mt-0.5 text-xs text-indigo-600">
                {activeCount} active
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {filters.length === 0 ? (
            <p className="text-center text-xs text-gray-400 mt-8">
              No filters configured for this page.
            </p>
          ) : (
            <div className="space-y-5">
              {filters.map((def) => (
                <div key={def.key}>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      {def.icon && <span className="mr-1">{def.icon}</span>}
                      {def.label}
                    </label>
                    {values[def.key] !== undefined &&
                      values[def.key] !== null &&
                      values[def.key] !== "" && (
                        <button
                          onClick={() => onFilterChange(def.key, null)}
                          className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                  </div>
                  <FilterInput
                    def={def}
                    value={values[def.key]}
                    onChange={(v) => onFilterChange(def.key, v)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
