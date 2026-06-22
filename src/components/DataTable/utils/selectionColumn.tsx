import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Checkbox } from "antd";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import { SELECTION_COL_ID } from "../constants";

/**
 * Creates the selection column definition for checkbox or radio mode.
 * Kept separate so it's easy to customise per-project.
 */
export function createSelectionColumn<TData>(
  mode: "checkbox" | "radio"
) {
  const helper = createColumnHelper<TData>();

  return helper.display({
    id: SELECTION_COL_ID,
    header: ({ table }) =>
      mode === "checkbox" ? (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={(e: CheckboxChangeEvent) => table.toggleAllPageRowsSelected(e.target.checked)}
          aria-label="Select all rows on page"
        />
      ) : null,
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={(e: CheckboxChangeEvent) => row.toggleSelected(e.target.checked)}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        aria-label={`Select row ${row.id}`}
        {...(mode === "radio" ? { type: "radio" } : {})}
      />
    ),
    size: 40,
    enableSorting: false,
    enableHiding: false,
    meta: { system: true },
  });
}
