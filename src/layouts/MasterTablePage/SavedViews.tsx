import { useState, useRef, useEffect } from "react";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import type { SavedView } from "./types";

interface SavedViewsProps {
  views: SavedView[];
  activeViewId: string | null;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: (name: string) => void;
}

export function SavedViews({ views, activeViewId, onLoad, onDelete, onSave }: SavedViewsProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (saving) inputRef.current?.focus();
  }, [saving]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName("");
      setSaving(false);
    }
  };

  if (views.length === 0 && !saving) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">No saved views</span>
        <button
          onClick={() => setSaving(true)}
          className="text-xs font-medium text-indigo-600 hover:underline"
        >
          + Save current view
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* All / default view */}
      <button
        onClick={() => {}}
        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
          !activeViewId
            ? "bg-indigo-100 text-indigo-700"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        }`}
      >
        All
      </button>

      {/* Saved view tabs */}
      {views.map((view) => (
        <span
          key={view.id}
          className={`group inline-flex items-center gap-1 rounded-lg pl-2.5 pr-1 py-1 text-xs font-medium transition-colors cursor-pointer ${
            activeViewId === view.id
              ? "bg-indigo-100 text-indigo-700"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          }`}
          onClick={() => onLoad(view.id)}
        >
          {view.name}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(view.id); }}
            className="ml-0.5 hidden h-4 w-4 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 group-hover:flex transition-colors"
          >
            <CloseOutlined style={{ fontSize: 9 }} />
          </button>
        </span>
      ))}

      {/* Save input */}
      {saving ? (
        <form
          onSubmit={(e) => { e.preventDefault(); handleSave(); }}
          className="flex items-center gap-1"
        >
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="View name…"
            className="h-7 w-32 rounded-lg border border-indigo-300 bg-white px-2 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-indigo-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => { setSaving(false); setName(""); }}
            className="text-[10px] text-gray-400 hover:text-gray-600"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setSaving(true)}
          className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <PlusOutlined className="text-xs" />
          Save view
        </button>
      )}
    </div>
  );
}
