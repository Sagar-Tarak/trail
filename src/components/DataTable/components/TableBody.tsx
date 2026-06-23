import { memo, useRef, type ReactElement } from "react";
import { flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { DataTableContext } from "../types/data-table.types";
import { DENSITY_CELL_CLS, DENSITY_ROW_HEIGHT_PX } from "../constants";
import { getPinnedStyle } from "../utils/pinnedStyle";

// Rows per page above which we activate the virtualizer.
// Below this threshold the overhead of virtual positioning isn't worth it.
const VIRTUALIZER_THRESHOLD = 100;

interface TableBodyProps<TData> {
  ctx: DataTableContext<TData>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export const TableBody = memo(function TableBody<TData>({
  ctx,
  scrollRef,
}: TableBodyProps<TData>) {
  const { table, density, zebraRows, onRowClick } = ctx;
  const rows = table.getRowModel().rows;

  const useVirtual = rows.length > VIRTUALIZER_THRESHOLD;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => DENSITY_ROW_HEIGHT_PX[density],
    overscan: 10,
    enabled: useVirtual,
  });

  const virtualRows = useVirtual ? rowVirtualizer.getVirtualItems() : null;
  const totalHeight = useVirtual ? rowVirtualizer.getTotalSize() : null;

  const renderRow = (row: (typeof rows)[number], virtualTop?: number) => {
    const isSelected = row.getIsSelected();
    const rowIdx = row.index;
    const isEven = rowIdx % 2 === 0;

    return (
      <tr
        key={row.id}
        data-index={virtualTop !== undefined ? row.index : undefined}
        onClick={() => onRowClick?.(row)}
        style={
          virtualTop !== undefined
            ? { position: "absolute", top: virtualTop, left: 0, width: "100%" }
            : undefined
        }
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
  };

  if (useVirtual && virtualRows) {
    return (
      <tbody style={{ height: totalHeight!, position: "relative" }}>
        {virtualRows.map((vRow) => renderRow(rows[vRow.index], vRow.start))}
      </tbody>
    );
  }

  return <tbody>{rows.map((row) => renderRow(row))}</tbody>;
}) as <TData>(props: TableBodyProps<TData>) => ReactElement;
