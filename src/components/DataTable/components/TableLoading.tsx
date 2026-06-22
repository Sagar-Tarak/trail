import { SKELETON_ROW_COUNT, DENSITY_CELL_CLS } from "../constants";
import type { DensityMode } from "../types/data-table.types";

interface TableLoadingProps {
  colCount: number;
  density: DensityMode;
}

export function TableLoading({ colCount, density }: TableLoadingProps) {
  return (
    <tbody aria-label="Loading table data" aria-busy="true">
      {Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIdx) => (
        <tr
          key={rowIdx}
          className="border-b border-[#E8EAED] bg-white"
          aria-hidden="true"
        >
          {Array.from({ length: colCount }).map((_, colIdx) => (
            <td
              key={colIdx}
              className={DENSITY_CELL_CLS[density]}
            >
              <div
                className="h-3 animate-pulse rounded-full bg-gray-100"
                style={{
                  width: colIdx === 0 ? "20px" : `${50 + Math.random() * 40}%`,
                  opacity: 1 - rowIdx * 0.08,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
