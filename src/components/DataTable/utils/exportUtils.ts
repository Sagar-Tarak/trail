import type { Row, Table } from "@tanstack/react-table";

function toCSV<TData>(rows: Row<TData>[]): string {
  if (!rows.length) return "";

  const headers = rows[0]
    .getAllCells()
    .filter((c) => c.column.id !== "__selection__")
    .map((c) => c.column.id);

  const escape = (val: unknown) => {
    const str = val == null ? "" : String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const csvRows = rows.map((row) =>
    row
      .getAllCells()
      .filter((c) => c.column.id !== "__selection__")
      .map((c) => escape(c.getValue()))
      .join(","),
  );

  return [headers.join(","), ...csvRows].join("\n");
}

export function exportCsv<TData>(rows: Row<TData>[], filename = "export") {
  const content = toCSV(rows);
  downloadBlob(
    new Blob([content], { type: "text/csv;charset=utf-8;" }),
    `${filename}.csv`,
  );
}

export function exportJson<TData>(rows: Row<TData>[], filename = "export") {
  const payload = rows.map((r) => r.original);
  const content = JSON.stringify(payload, null, 2);
  downloadBlob(
    new Blob([content], { type: "application/json" }),
    `${filename}.json`,
  );
}

// dynamic import keeps xlsx out of the main bundle (pnpm add xlsx)
export async function exportExcel<TData>(
  rows: Row<TData>[],
  filename = "export",
) {
  // Dynamic import keeps xlsx out of the main bundle
  const XLSX = await import("xlsx");

  const wsData = rows.map((r) =>
    Object.fromEntries(
      r
        .getAllCells()
        .filter((c) => c.column.id !== "__selection__")
        .map((c) => [c.column.id, c.getValue()]),
    ),
  );

  const ws = XLSX.utils.json_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Export");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function resolveExportRows<TData>(
  table: Table<TData>,
  scope: "current-page" | "selected" | "filtered-all",
): Row<TData>[] {
  switch (scope) {
    case "selected":
      return table.getSelectedRowModel().rows;
    case "filtered-all":
      // With server-side data this only returns locally held rows.
      // Consumer should override for true "all filtered" exports.
      return table.getFilteredRowModel().rows;
    case "current-page":
    default:
      return table.getPaginationRowModel().rows;
  }
}
