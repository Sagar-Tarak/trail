import { memo, type ReactElement } from "react";
import { flexRender } from "@tanstack/react-table";
import type { DataTableContext } from "../types/data-table.types";
import { DENSITY_CELL_CLS } from "../constants";
import { getPinnedStyle } from "../utils/pinnedStyle";

interface TableBodyProps<TData> {
  ctx: DataTableContext<TData>;
}

export const TableBody = memo(function TableBody<TData>({
  ctx,
}: TableBodyProps<TData>) {
  const { table, density, zebraRows, onRowClick } = ctx;
  const rows = table.getRowModel().rows;

  return (
    <tbody>
      {rows.map((row, rowIdx) => {
        const isSelected = row.getIsSelected();
        const isEven = rowIdx % 2 === 0;

        return (
          <tr
            key={row.id}
            onClick={() => onRowClick?.(row)}
            className={[
              "group border-b border-[#E8EAED] transition-colors",
              isSelected
                ? "bg-[#EEF2FF]"
                : zebraRows && isEven
                ? "bg-gray-50/60 hover:bg-[#F5F7FA]"
                : "bg-white hover:bg-[#F5F7FA]",
              onRowClick ? "cursor-pointer" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-selected={isSelected}
          >
            {row.getVisibleCells().map((cell) => {
              const pinned = cell.column.getIsPinned();

              return (
                <td
                  key={cell.id}
                  style={{
                    width: cell.column.getSize(),
                    ...getPinnedStyle(cell.column),
                  }}
                  className={[
                    DENSITY_CELL_CLS[density],
                    "text-xs text-gray-700",
                    isSelected ? "bg-[#EEF2FF]" : "bg-inherit",
                    pinned === "left"
                      ? "after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-[#E8EAED] relative"
                      : "",
                    pinned === "right"
                      ? "before:absolute before:left-0 before:top-0 before:h-full before:w-px before:bg-[#E8EAED] relative"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  );
}) as <TData>(props: TableBodyProps<TData>) => ReactElement;
