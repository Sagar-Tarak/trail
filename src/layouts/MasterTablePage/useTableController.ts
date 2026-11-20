import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type {
  MasterTableConfig,
  QueryParams,
  QueryResult,
  Density,
  SortDir,
  SavedView,
  ColumnDef,
} from "./types";
import {
  loadPreferences,
  savePreferences,
  loadSavedViews,
  persistSavedViews,
} from "./persistence";

function rowKey<T extends object>(
  record: T,
  cfg: MasterTableConfig<T>["rowKey"],
): string {
  return typeof cfg === "function" ? cfg(record) : String(record[cfg]);
}

// generic debounce hook - keeps search from firing on every keystroke
function useDebounce<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export interface TableController<T extends object> {
  queryResult: QueryResult<T>;
  queryParams: QueryParams;

  // searchInput is what the user sees, debouncedSearch is what goes to the API
  searchInput: string;
  setSearch: (s: string) => void;

  page: number;
  pageSize: number;
  setPage: (p: number) => void;
  setPageSize: (ps: number) => void;

  filters: Record<string, unknown>;
  setFilter: (key: string, value: unknown) => void;
  clearFilters: () => void;
  activeFilterCount: number;

  sortKey: string | null;
  sortDir: SortDir;
  setSort: (key: string) => void;

  columnVisibility: Record<string, boolean>;
  setColumnVisibility: (key: string, visible: boolean) => void;
  toggleAllColumns: (visible: boolean) => void;
  visibleColumns: ColumnDef<T>[];

  density: Density;
  setDensity: (d: Density) => void;

  // selection is per-page only, clears on page change
  selectedIds: Set<string>;
  selectedRecords: T[];
  toggleRow: (record: T) => void;
  toggleAll: () => void;
  clearSelection: () => void;
  isAllSelected: boolean;
  isSomeSelected: boolean;

  drawerRecord: T | null;
  openDrawer: (record: T) => void;
  closeDrawer: () => void;

  isFilterPanelOpen: boolean;
  toggleFilterPanel: () => void;

  savedViews: SavedView[];
  activeViewId: string | null;
  saveCurrentView: (name: string) => void;
  loadView: (id: string) => void;
  deleteView: (id: string) => void;

  getRowKey: (record: T) => string;
}

export function useTableController<T extends object>(
  config: MasterTableConfig<T>,
): TableController<T> {
  const pk = config.persistenceKey;

  const prefs = useMemo(() => loadPreferences(pk), [pk]);

  // config.columns is a stable module-level constant so [pk] is enough here
  const defaultColVisibility = useMemo(
    () =>
      Object.fromEntries(
        config.columns.map((c) => [c.key, c.defaultVisible !== false]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pk],
  );

  const [searchInput, setSearchInput] = useState("");
  const [page, setPageRaw] = useState(1);
  const [pageSize, setPageSizeRaw] = useState(
    prefs?.pageSize ?? config.defaultPageSize ?? 20,
  );
  const [filters, setFiltersRaw] = useState<Record<string, unknown>>({});
  const [sortKey, setSortKey] = useState<string | null>(prefs?.sortKey ?? null);
  const [sortDir, setSortDir] = useState<SortDir>(prefs?.sortDir ?? null);
  const [columnVisibility, setColVis] = useState<Record<string, boolean>>({
    ...defaultColVisibility,
    ...(prefs?.columnVisibility ?? {}),
  });
  const [density, setDensityRaw] = useState<Density>(
    prefs?.density ?? config.defaultDensity ?? "default",
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerRecord, setDrawerRecord] = useState<T | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>(() =>
    loadSavedViews(pk),
  );
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  // 300ms feels right — fast enough to not feel laggy, not hammering the API
  const debouncedSearch = useDebounce(searchInput, 300);

  // read URL params on mount so users can share links with filters/search pre-applied
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = p.get("q");
    const pg = p.get("p");
    const f = p.get("f");
    const s = p.get("s");
    const d = p.get("d") as SortDir;
    if (q) setSearchInput(q);
    if (pg && Number(pg) > 1) setPageRaw(Number(pg));
    // filters are base64'd JSON — silently ignore if someone mangled the URL
    if (f) {
      try {
        setFiltersRaw(JSON.parse(atob(f)));
      } catch {}
    }
    if (s) {
      setSortKey(s);
      if (d) setSortDir(d);
    }
    // intentionally runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync state back to URL so the browser history works and links are shareable
  const firstRender = useRef(true);
  useEffect(() => {
    // skip first render — we haven't read the URL yet, don't overwrite it
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const p = new URLSearchParams();
    if (debouncedSearch) p.set("q", debouncedSearch);
    if (page > 1) p.set("p", String(page));
    // base64 encode filters so the URL doesn't become unreadable with nested objects
    if (Object.keys(filters).length > 0)
      p.set("f", btoa(JSON.stringify(filters)));
    if (sortKey) {
      p.set("s", sortKey);
      if (sortDir) p.set("d", sortDir);
    }
    const qs = p.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `?${qs}` : window.location.pathname,
    );
  }, [debouncedSearch, page, filters, sortKey, sortDir]);

  // persist column/density/sort prefs to localStorage so they survive page refresh
  useEffect(() => {
    savePreferences(pk, {
      columnVisibility,
      density,
      pageSize,
      sortKey,
      sortDir,
    });
  }, [pk, columnVisibility, density, pageSize, sortKey, sortDir]);

  const queryParams = useMemo<QueryParams>(
    () => ({
      page,
      pageSize,
      search: debouncedSearch,
      filters,
      sortKey,
      sortDir,
    }),
    [page, pageSize, debouncedSearch, filters, sortKey, sortDir],
  );

  const queryResult = config.queryHook(queryParams);

  const visibleColumns = useMemo(
    () => config.columns.filter((c) => columnVisibility[c.key] !== false),
    [config.columns, columnVisibility],
  );

  // count how many filters are actually active (ignore empty arrays, null, etc.)
  const activeFilterCount = useMemo(
    () =>
      Object.values(filters).filter((v) => {
        if (Array.isArray(v)) return v.length > 0;
        if (v && typeof v === "object") return Object.values(v).some(Boolean);
        return v !== null && v !== undefined && v !== "";
      }).length,
    [filters],
  );

  const getRowKey = useCallback(
    (r: T) => rowKey(r, config.rowKey),
    [config.rowKey],
  );

  // reset to page 1 whenever search changes so you don't land on a page that doesn't exist
  const setSearch = useCallback((s: string) => {
    setSearchInput(s);
    setPageRaw(1);
  }, []);

  const setPage = useCallback((p: number) => {
    setPageRaw(p);
    setSelectedIds(new Set()); // clear selection when navigating pages
  }, []);

  const setPageSize = useCallback((ps: number) => {
    setPageSizeRaw(ps);
    setPageRaw(1);
  }, []);

  const setFilter = useCallback((key: string, value: unknown) => {
    setFiltersRaw((prev) => {
      // treat null, empty string, empty array, and all-falsy objects as "remove this filter"
      // a bit verbose but we have multiple filter shapes (text, multi-select, date range, number range)
      const isEmpty =
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0) ||
        (value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          Object.values(value as object).every((v) => !v));

      if (isEmpty) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
    setPageRaw(1);
    setActiveViewId(null); // changing a filter deactivates any saved view
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersRaw({});
    setPageRaw(1);
    setActiveViewId(null);
  }, []);

  // clicking the same column cycles: none → asc → desc → none
  const setSort = useCallback(
    (key: string) => {
      if (key !== sortKey) {
        setSortKey(key);
        setSortDir("asc");
      } else if (sortDir === "asc") {
        setSortDir("desc");
      } else {
        setSortKey(null);
        setSortDir(null);
      }
      setPageRaw(1);
    },
    [sortKey, sortDir],
  );

  const setColumnVisibility = useCallback((key: string, visible: boolean) => {
    setColVis((prev) => ({ ...prev, [key]: visible }));
  }, []);

  const toggleAllColumns = useCallback(
    (visible: boolean) => {
      setColVis(
        Object.fromEntries(config.columns.map((c) => [c.key, visible])),
      );
    },
    [config.columns],
  );

  const setDensity = useCallback((d: Density) => setDensityRaw(d), []);

  const toggleRow = useCallback(
    (record: T) => {
      const key = getRowKey(record);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
      });
    },
    [getRowKey],
  );

  const toggleAll = useCallback(() => {
    if (selectedIds.size === queryResult.data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(queryResult.data.map(getRowKey)));
    }
  }, [selectedIds.size, queryResult.data, getRowKey]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const selectedRecords = useMemo(
    () => queryResult.data.filter((r) => selectedIds.has(getRowKey(r))),
    [queryResult.data, selectedIds, getRowKey],
  );

  const openDrawer = useCallback((record: T) => {
    setDrawerRecord(record);
    // filter panel stays open — they're on opposite sides so they don't conflict
  }, []);

  const closeDrawer = useCallback(() => setDrawerRecord(null), []);

  const toggleFilterPanel = useCallback(
    () => setIsFilterPanelOpen((v) => !v),
    [],
  );

  const saveCurrentView = useCallback(
    (name: string) => {
      // Date.now() as id is fine here — saved views are local-only, no sync needed
      const view: SavedView = {
        id: `view_${Date.now()}`,
        name,
        filters,
        columnVisibility,
        sortKey,
        sortDir,
        search: searchInput,
      };
      setSavedViews((prev) => {
        const next = [...prev, view];
        persistSavedViews(pk, next);
        return next;
      });
      setActiveViewId(view.id);
    },
    [pk, filters, columnVisibility, sortKey, sortDir, searchInput],
  );

  const loadView = useCallback(
    (id: string) => {
      const view = savedViews.find((v) => v.id === id);
      if (!view) return;
      setFiltersRaw(view.filters);
      setColVis(view.columnVisibility);
      setSortKey(view.sortKey);
      setSortDir(view.sortDir);
      setSearchInput(view.search);
      setPageRaw(1);
      setActiveViewId(id);
    },
    [savedViews],
  );

  const deleteView = useCallback(
    (id: string) => {
      setSavedViews((prev) => {
        const next = prev.filter((v) => v.id !== id);
        persistSavedViews(pk, next);
        return next;
      });
      if (activeViewId === id) setActiveViewId(null);
    },
    [pk, activeViewId],
  );

  return {
    queryResult,
    queryParams,
    searchInput,
    setSearch,
    page,
    pageSize,
    setPage,
    setPageSize,
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
    sortKey,
    sortDir,
    setSort,
    columnVisibility,
    setColumnVisibility,
    toggleAllColumns,
    visibleColumns,
    density,
    setDensity,
    selectedIds,
    selectedRecords,
    toggleRow,
    toggleAll,
    clearSelection,
    isAllSelected:
      queryResult.data.length > 0 &&
      selectedIds.size === queryResult.data.length,
    isSomeSelected:
      selectedIds.size > 0 && selectedIds.size < queryResult.data.length,
    drawerRecord,
    openDrawer,
    closeDrawer,
    isFilterPanelOpen,
    toggleFilterPanel,
    savedViews,
    activeViewId,
    saveCurrentView,
    loadView,
    deleteView,
    getRowKey,
  };
}
