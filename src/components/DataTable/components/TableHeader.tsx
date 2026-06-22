import type { Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { DENSITY_CELL_CLS } from "../constants";
import type { DensityMode } from "../types/data-table.types";
import { getPinnedStyle } from "../utils/pinnedStyle";

interface TableHeaderProps<TData> {
  table: Table<TData>;
  density: DensityMode;
}

export function TableHeader<TData>({ table, density }: TableHeaderProps<TData>) {
  return (
    <thead>
      {table.getHeaderGroups().map((hg) => (
        <tr key={hg.id} className="border-b border-[#E8EAED] bg-[#FAFAFB]">
          {hg.headers.map((header) => {
            const canSort = header.column.getCanSort();
            const sortDir = header.column.getIsSorted();
            const pinned = header.column.getIsPinned();

            return (
              <th
                key={header.id}
                colSpan={header.colSpan}
                style={{
                  width: header.getSize(),
                  ...getPinnedStyle(header.column),
                }}
                className={[
                  DENSITY_CELL_CLS[density],
                  "select-none whitespace-nowrap text-left text-[11px] font-medium text-gray-500",
                  "sticky top-0 z-10 bg-[#FAFAFB]",
                  pinned ? "z-20" : "",
                  canSort ? "cursor-pointer hover:text-gray-700" : "",
                  pinned === "left"
                    ? "after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-[#E8EAED]"
                    : "",
                  pinned === "right"
                    ? "before:absolute before:left-0 before:top-0 before:h-full before:w-px before:bg-[#E8EAED]"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                aria-sort={
                  sortDir === "asc"
                    ? "ascending"
                    : sortDir === "desc"
                    ? "descending"
                    : canSort
                    ? "none"
                    : undefined
                }
              >
                {header.isPlaceholder ? null : (
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {canSort && (
                      <span className="ml-0.5 text-gray-300" aria-hidden="true">
                        {sortDir === "asc" ? (
                          <SortAscIcon />
                        ) : sortDir === "desc" ? (
                          <SortDescIcon />
                        ) : (
                          <SortNeutralIcon />
                        )}
                      </span>
                    )}
                  </div>
                )}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}

function SortAscIcon() {
  return (
    <svg className="h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M11.47 7.72a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 0 1-1.06-1.06l7.5-7.5Z" clipRule="evenodd" />
    </svg>
  );
}

function SortDescIcon() {
  return (
    <svg className="h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clipRule="evenodd" />
    </svg>
  );
}

function SortNeutralIcon() {
  return (
    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M6.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06L8 4.56V20.44l3.47-3.47a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06L7 20.44V4.56L3.53 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5Zm9 0a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 1 1-1.06 1.06L17 4.56V20.44l3.47-3.47a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06L16 20.44V4.56l-3.47 3.47a.75.75 0 0 1-1.06-1.06l4.5-4.5Z" clipRule="evenodd" />
    </svg>
  );
}
