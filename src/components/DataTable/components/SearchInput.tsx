import { useEffect, useRef, useState, useCallback } from "react";
import { SEARCH_DEBOUNCE_MS } from "../constants";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** keyboard shortcut to focus (e.g. "/" or "k") - default "/" */
  shortcut?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  shortcut = "/",
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync external clear (e.g. reset filters)
  useEffect(() => {
    if (value === "" && localValue !== "") setLocalValue("");
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setLocalValue(v);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(v), SEARCH_DEBOUNCE_MS);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setLocalValue("");
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  // Global keyboard shortcut to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (e.key === shortcut && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [shortcut]);

  return (
    <div className="relative flex items-center">
      {/* Search icon */}
      <svg
        className="absolute left-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z"
        />
      </svg>

      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="Search table"
        className="
          h-8 w-56 rounded-full border border-[#E8EAED] bg-white pl-8 pr-8
          text-xs text-gray-700 placeholder:text-gray-400
          outline-none ring-0
          focus:border-blue-400 focus:ring-2 focus:ring-blue-100
          transition-colors
        "
      />

      {/* Clear button */}
      {localValue && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-300 text-white hover:bg-gray-400 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={3}
            stroke="currentColor"
            className="h-2 w-2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Shortcut hint */}
      {!localValue && (
        <kbd className="absolute right-2.5 hidden rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[10px] text-gray-400 sm:inline-block">
          {shortcut}
        </kbd>
      )}
    </div>
  );
}
