import type { BulkAction } from "./types";

interface BulkActionBarProps<T> {
  count: number;
  actions: BulkAction<T>[];
  selected: T[];
  onClear: () => void;
}

export function BulkActionBar<T>({
  count,
  actions,
  selected,
  onClear,
}: BulkActionBarProps<T>) {
  if (count === 0) return null;

  const visibleActions = actions.filter((a) => !a.show || a.show(selected));

  return (
    <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">
          {count}
        </span>
        <span className="text-xs font-semibold text-indigo-800">
          {count === 1 ? "row selected" : "rows selected"}
        </span>
      </div>

      {visibleActions.length > 0 && (
        <>
          <div className="h-4 w-px bg-indigo-200" />
          <div className="flex items-center gap-2">
            {visibleActions.map((action) => (
              <button
                key={action.key}
                onClick={() => action.onClick(selected)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  action.danger
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-white text-indigo-700 shadow-sm hover:bg-indigo-100 border border-indigo-200"
                }`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}

      <button
        onClick={onClear}
        className="ml-auto text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
      >
        Clear selection
      </button>
    </div>
  );
}
