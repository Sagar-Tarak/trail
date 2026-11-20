/** Quote all cells and neutralize spreadsheet formula prefixes in captured text. */
export function reportCsv(rows: unknown[][]): string {
  return (
    "\ufeff" +
    rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");
            const safe = /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;
            return '"' + safe.replaceAll('"', '""') + '"';
          })
          .join(","),
      )
      .join("\r\n")
  );
}
