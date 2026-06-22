import { useEffect } from "react";
import type { Table } from "@tanstack/react-table";
import { useTableStore } from "../../../store/useTableStore";

export function useTablePersistence<TData>(table: Table<TData>, tableId: string) {
  const { setColumnVisibility, setColumnPinning, setPageSize } = useTableStore();

  const columnVisibility = table.getState().columnVisibility;
  const columnPinning = table.getState().columnPinning;
  const pageSize = table.getState().pagination.pageSize;

  useEffect(() => {
    setColumnVisibility(tableId, columnVisibility);
  }, [columnVisibility, tableId]);

  useEffect(() => {
    setColumnPinning(tableId, columnPinning);
  }, [columnPinning, tableId]);

  useEffect(() => {
    setPageSize(tableId, pageSize);
  }, [pageSize, tableId]);
}
