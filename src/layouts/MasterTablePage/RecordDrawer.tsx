import { useEffect, type ComponentType } from "react";
import { CloseOutlined } from "@ant-design/icons";

interface RecordDrawerProps<T> {
  record: T | null;
  onClose: () => void;
  component: ComponentType<{ record: T; onClose: () => void }>;
  width?: number | string;
  title?: (record: T) => string;
}

export function RecordDrawer<T>({
  record,
  onClose,
  component: Component,
  width = 480,
  title,
}: RecordDrawerProps<T>) {
  const open = record !== null;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-black/10 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer — slides from right */}
      <div
        className={`fixed inset-y-0 right-0 z-40 flex flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out`}
        style={{
          width: typeof width === "number" ? width : width,
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {record && title ? title(record) : "Details"}
          </h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <CloseOutlined className="text-sm" />
          </button>
        </div>

        {/* Content — only mounted when open to allow component state reset */}
        <div className="flex-1 overflow-y-auto">
          {record !== null && <Component record={record} onClose={onClose} />}
        </div>
      </div>
    </>
  );
}
