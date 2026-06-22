import type { Density, SortDir, SavedView } from "./types";

export interface StoredPreferences {
  columnVisibility: Record<string, boolean>;
  density: Density;
  pageSize: number;
  sortKey: string | null;
  sortDir: SortDir;
}

const prefsKey = (k: string) => `mtp_prefs_${k}`;
const viewsKey = (k: string) => `mtp_views_${k}`;

export function loadPreferences(key: string): StoredPreferences | null {
  try {
    const raw = localStorage.getItem(prefsKey(key));
    return raw ? (JSON.parse(raw) as StoredPreferences) : null;
  } catch {
    return null;
  }
}

export function savePreferences(key: string, prefs: StoredPreferences): void {
  try {
    localStorage.setItem(prefsKey(key), JSON.stringify(prefs));
  } catch {
    // quota exceeded or private mode — silently skip
  }
}

export function loadSavedViews(key: string): SavedView[] {
  try {
    const raw = localStorage.getItem(viewsKey(key));
    return raw ? (JSON.parse(raw) as SavedView[]) : [];
  } catch {
    return [];
  }
}

export function persistSavedViews(key: string, views: SavedView[]): void {
  try {
    localStorage.setItem(viewsKey(key), JSON.stringify(views));
  } catch {}
}
