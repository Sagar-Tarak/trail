import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { VisibilityState, ColumnPinningState } from "@tanstack/react-table";
import type { DensityMode } from "../components/DataTable/types/data-table.types";
import { DEFAULT_PAGE_SIZE, DEFAULT_DENSITY } from "../components/DataTable/constants";

interface TablePrefs {
  columnVisibility: VisibilityState;
  columnPinning: ColumnPinningState;
  pageSize: number;
  density: DensityMode;
  zebraRows: boolean;
}

interface TableStoreState {
  tables: Record<string, TablePrefs>;
  getPrefs: (tableId: string) => TablePrefs;
  setColumnVisibility: (tableId: string, visibility: VisibilityState) => void;
  setColumnPinning: (tableId: string, pinning: ColumnPinningState) => void;
  setPageSize: (tableId: string, pageSize: number) => void;
  setDensity: (tableId: string, density: DensityMode) => void;
  setZebraRows: (tableId: string, zebraRows: boolean) => void;
}

const defaultPrefs = (): TablePrefs => ({
  columnVisibility: {},
  columnPinning: {},
  pageSize: DEFAULT_PAGE_SIZE,
  density: DEFAULT_DENSITY,
  zebraRows: false,
});

const ensureTable = (tables: Record<string, TablePrefs>, tableId: string): TablePrefs =>
  tables[tableId] ?? defaultPrefs();

export const useTableStore = create<TableStoreState>()(
  persist(
    (set, get) => ({
      tables: {},

      getPrefs: (tableId) => ensureTable(get().tables, tableId),

      setColumnVisibility: (tableId, visibility) =>
        set((s) => ({
          tables: {
            ...s.tables,
            [tableId]: { ...ensureTable(s.tables, tableId), columnVisibility: visibility },
          },
        })),

      setColumnPinning: (tableId, pinning) =>
        set((s) => ({
          tables: {
            ...s.tables,
            [tableId]: { ...ensureTable(s.tables, tableId), columnPinning: pinning },
          },
        })),

      setPageSize: (tableId, pageSize) =>
        set((s) => ({
          tables: {
            ...s.tables,
            [tableId]: { ...ensureTable(s.tables, tableId), pageSize },
          },
        })),

      setDensity: (tableId, density) =>
        set((s) => ({
          tables: {
            ...s.tables,
            [tableId]: { ...ensureTable(s.tables, tableId), density },
          },
        })),

      setZebraRows: (tableId, zebraRows) =>
        set((s) => ({
          tables: {
            ...s.tables,
            [tableId]: { ...ensureTable(s.tables, tableId), zebraRows },
          },
        })),
    }),
    {
      name: "trail-table-prefs",
    }
  )
);
