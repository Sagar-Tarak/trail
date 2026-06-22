import { useRef, useState, useCallback } from "react";
import type { Table } from "@tanstack/react-table";
import { useClickOutside } from "../hooks/useClickOutside";
import type { DataTableColumnMeta } from "../types/data-table.types";

interface ColumnDropdownProps<TData> {
  table: Table<TData>;
}

export function ColumnDropdown<TData>({ table }: ColumnDropdownProps<TData>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const columns = table
    .getAllLeafColumns()
    .filter((c) => !(c.columnDef.meta as DataTableColumnMeta | undefined)?.system);

  const handleReset = useCallback(() => {
    table.resetColumnVisibility();
    table.resetColumnPinning();
  }, [table]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle column visibility"
        aria-expanded={open}
        className="dt-toolbar-btn"
      >
        <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15M3 9h18M3 15h18" />
        </svg>
        Columns
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-[#E8EAED] bg-white py-1.5 shadow-sm">
          <div className="flex items-center justify-between px-3 pb-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Columns
            </span>
            <button
              onClick={handleReset}
              className="text-[10px] text-blue-500 hover:text-blue-600 transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="border-t border-[#E8EAED] pt-1">
            {columns.map((col) => {
              const meta = col.columnDef.meta as DataTableColumnMeta | undefined;
              const label = meta?.label ?? col.id;
              const isPinnedLeft = col.getIsPinned() === "left";
              const isPinnedRight = col.getIsPinned() === "right";

              return (
                <div
                  key={col.id}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    id={`col-${col.id}`}
                    checked={col.getIsVisible()}
                    onChange={(e) => col.toggleVisibility(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-300 accent-blue-500"
                    aria-label={`Toggle ${label} column`}
                  />
                  <label
                    htmlFor={`col-${col.id}`}
                    className="flex-1 cursor-pointer select-none text-xs text-gray-700"
                  >
                    {label}
                  </label>

                  {/* Pin controls */}
                  <div className="flex gap-0.5">
                    <button
                      onClick={() =>
                        col.pin(isPinnedLeft ? false : "left")
                      }
                      title="Pin left"
                      aria-label={`${isPinnedLeft ? "Unpin" : "Pin"} ${label} to left`}
                      className={`flex h-5 w-5 items-center justify-center rounded text-[10px] transition-colors ${
                        isPinnedLeft
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-300 hover:text-gray-500"
                      }`}
                    >
                      L
                    </button>
                    <button
                      onClick={() =>
                        col.pin(isPinnedRight ? false : "right")
                      }
                      title="Pin right"
                      aria-label={`${isPinnedRight ? "Unpin" : "Pin"} ${label} to right`}
                      className={`flex h-5 w-5 items-center justify-center rounded text-[10px] transition-colors ${
                        isPinnedRight
                          ? "bg-blue-100 text-blue-600"
                          : "text-gray-300 hover:text-gray-500"
                      }`}
                    >
                      R
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
