import { useRef, useState } from "react";
import type { DensityMode } from "../types/data-table.types";
import { useClickOutside } from "../hooks/useClickOutside";

const OPTIONS: { value: DensityMode; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
];

interface DensityDropdownProps {
  value: DensityMode;
  onChange: (value: DensityMode) => void;
}

export function DensityDropdown({ value, onChange }: DensityDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change row density"
        aria-expanded={open}
        className="dt-toolbar-btn"
      >
        {/* Density icon - horizontal lines with varying gaps */}
        <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
        </svg>
        Density
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-40 rounded-xl border border-[#E8EAED] bg-white py-1.5 shadow-sm">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-gray-50 ${
                value === opt.value ? "text-blue-600 font-medium" : "text-gray-700"
              }`}
              aria-pressed={value === opt.value}
            >
              {value === opt.value && (
                <svg className="h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
              <span className={value === opt.value ? "" : "pl-5"}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
