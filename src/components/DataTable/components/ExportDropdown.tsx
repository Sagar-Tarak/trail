import { useRef, useState, useCallback } from "react";
import type { Table } from "@tanstack/react-table";
import { useClickOutside } from "../hooks/useClickOutside";
import {
  exportCsv,
  exportExcel,
  exportJson,
  resolveExportRows,
} from "../utils/exportUtils";
import type { ExportFormat, ExportScope } from "../types/data-table.types";

interface ExportDropdownProps<TData> {
  table: Table<TData>;
  filename?: string;
  hasSelection: boolean;
}

const SCOPES: { value: ExportScope; label: string }[] = [
  { value: "current-page", label: "Current page" },
  { value: "selected", label: "Selected rows" },
  { value: "filtered-all", label: "All filtered rows" },
];

const FORMATS: { value: ExportFormat; label: string; ext: string }[] = [
  { value: "csv", label: "CSV", ext: ".csv" },
  { value: "excel", label: "Excel", ext: ".xlsx" },
  { value: "json", label: "JSON", ext: ".json" },
];

export function ExportDropdown<TData>({
  table,
  filename = "export",
  hasSelection,
}: ExportDropdownProps<TData>) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<ExportScope>("current-page");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setLoading(true);
      try {
        const rows = resolveExportRows(table, scope);
        if (format === "csv") exportCsv(rows, filename);
        else if (format === "json") exportJson(rows, filename);
        else await exportExcel(rows, filename);
      } finally {
        setLoading(false);
        setOpen(false);
      }
    },
    [table, scope, filename],
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Export data"
        aria-expanded={open}
        className="dt-toolbar-btn"
        disabled={loading}
      >
        <svg
          className="h-3.5 w-3.5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        {loading ? "Exporting..." : "Export"}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-[#E8EAED] bg-white py-1.5 shadow-sm">
          {/* Scope */}
          <div className="px-3 pb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Scope
            </span>
          </div>
          {SCOPES.filter((s) => s.value !== "selected" || hasSelection).map(
            (s) => (
              <button
                key={s.value}
                onClick={() => setScope(s.value)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-gray-50 ${
                  scope === s.value
                    ? "text-blue-600 font-medium"
                    : "text-gray-700"
                }`}
                aria-pressed={scope === s.value}
              >
                {scope === s.value ? (
                  <svg
                    className="h-3 w-3 shrink-0 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                ) : (
                  <span className="w-3 shrink-0" />
                )}
                {s.label}
              </button>
            ),
          )}

          <div className="my-1.5 border-t border-[#E8EAED]" />

          {/* Format */}
          <div className="px-3 pb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Format
            </span>
          </div>
          {FORMATS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleExport(f.value)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-gray-700 transition-colors hover:bg-gray-50"
            >
              <span>{f.label}</span>
              <span className="text-[10px] text-gray-400">{f.ext}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
