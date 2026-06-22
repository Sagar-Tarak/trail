import type { DensityMode } from "./types/data-table.types";

export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE_SIZE_OPTIONS = [
  10, 20, 50, 100, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000,
];
export const DEFAULT_DENSITY: DensityMode = "compact";
export const SEARCH_DEBOUNCE_MS = 300;

/** Tailwind row padding by density */
export const DENSITY_ROW_CLS: Record<DensityMode, string> = {
  compact: "py-2",
  comfortable: "py-3.5",
};

/** Tailwind cell padding by density */
export const DENSITY_CELL_CLS: Record<DensityMode, string> = {
  compact: "px-3 py-2",
  comfortable: "px-3 py-3.5",
};

export const SKELETON_ROW_COUNT = 8;

export const SELECTION_COL_ID = "__selection__";
export const ACTIONS_COL_ID = "__actions__";
