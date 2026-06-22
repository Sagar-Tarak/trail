import type { SidebarProps } from "./types";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { SidebarItem } from "./SidebarItem";
import { useState } from "react";

export function Sidebar({ items, collapsed = false, onCollapse, onNavigate }: SidebarProps) {
  const [activePath, setActivePath] = useState(items[0]?.href ?? "/");

  const handleNavigate = (href: string) => {
    setActivePath(href);
    onNavigate?.(href);
  };

  return (
    <aside className={`relative flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out ${collapsed ? "w-14" : "w-60"}`}>
      {/* Logo area */}
      <div className={`flex h-14 shrink-0 items-center border-b border-gray-200 px-3 ${collapsed ? "justify-center" : "gap-2.5"}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
          T
        </div>
        {!collapsed && <span className="text-sm font-semibold text-gray-800 truncate">TrailApp</span>}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        <ul className="space-y-0.5">
          {items.map((item) => (
            <SidebarItem key={item.href} item={item} collapsed={collapsed} activePath={activePath} onNavigate={handleNavigate} />
          ))}
        </ul>
      </nav>

      {!collapsed && (
        <div className="border-t border-gray-100 px-3 py-3">
          <p className="text-[10px] text-gray-400 truncate">v1.0.0 · TrailApp</p>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => onCollapse?.(!collapsed)}
        className="absolute -right-3 top-16 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <RightOutlined className="text-xs" /> : <LeftOutlined className="text-xs" />}
      </button>
    </aside>
  );
}
