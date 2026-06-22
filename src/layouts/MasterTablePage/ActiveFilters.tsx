import { CloseOutlined } from "@ant-design/icons";
import type { FilterDef } from "./types";

function getLabel(def: FilterDef, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";

  if (def.type === "multi-select" && Array.isArray(value)) {
    const labels = (value as string[]).map(
      (v) => def.options?.find((o) => o.value === v)?.label ?? v
    );
    return labels.join(", ");
  }

  if (def.type === "select") {
    return def.options?.find((o) => o.value === String(value))?.label ?? String(value);
  }

  if (def.type === "date-range" && typeof value === "object") {
    const r = value as { from?: string; to?: string };
    if (r.from && r.to) return `${r.from} → ${r.to}`;
    if (r.from) return `from ${r.from}`;
    if (r.to) return `until ${r.to}`;
    return "";
  }

  if (def.type === "number-range" && typeof value === "object") {
    const r = value as { min?: number; max?: number };
    if (r.min !== undefined && r.max !== undefined) return `${r.min} – ${r.max}`;
    if (r.min !== undefined) return `≥ ${r.min}`;
    if (r.max !== undefined) return `≤ ${r.max}`;
    return "";
  }

  if (def.type === "boolean") {
    return value === true ? "Yes" : "No";
  }

  return String(value);
}

interface ActiveFiltersProps {
  filters: FilterDef[];
  values: Record<string, unknown>;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({ filters, values, onRemove, onClearAll }: ActiveFiltersProps) {
  const active = filters.filter((f) => {
    const v = values[f.key];
    if (v === null || v === undefined || v === "") return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.values(v as object).some(Boolean);
    return true;
  });

  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-gray-400">Active:</span>
      {active.map((def) => {
        const label = getLabel(def, values[def.key]);
        if (!label) return null;
        return (
          <span
            key={def.key}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 pl-2.5 pr-1.5 py-0.5 text-xs font-medium text-indigo-700"
          >
            <span className="font-semibold text-indigo-500">{def.label}:</span>
            {label}
            <button
              onClick={() => onRemove(def.key)}
              className="flex h-4 w-4 items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-700 transition-colors"
            >
              <CloseOutlined style={{ fontSize: 9 }} />
            </button>
          </span>
        );
      })}
      <button
        onClick={onClearAll}
        className="text-xs text-gray-400 underline-offset-2 hover:text-red-500 hover:underline transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}
