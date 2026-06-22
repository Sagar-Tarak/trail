import { useState } from "react";
import type { NavbarProps } from "./types";
import {
  MenuOutlined,
  BellOutlined,
  SearchOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

export function Navbar({ title = "Dashboard", onMenuToggle, sidebarCollapsed }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 shadow-sm">
      {/* Hamburger / toggle */}
      <button
        onClick={onMenuToggle}
        className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <MenuOutlined className="text-base" />
      </button>

      {/* Brand */}
      <span className="mr-4 text-sm font-semibold text-gray-800 lg:text-base">{title}</span>

      {/* Search bar */}
      <div className="flex flex-1 items-center">
        <div
          className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 transition-all duration-200 ${
            searchOpen ? "w-64 ring-2 ring-indigo-300" : "w-40 cursor-pointer hover:border-gray-300"
          }`}
          onClick={() => setSearchOpen(true)}
          onBlur={() => setSearchOpen(false)}
        >
          <SearchOutlined className="text-sm text-gray-400" />
          <input
            type="text"
            placeholder="Search…"
            className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            onFocus={() => setSearchOpen(true)}
          />
          {searchOpen && (
            <kbd className="hidden rounded bg-gray-200 px-1 py-0.5 text-xs text-gray-400 sm:block">⌘K</kbd>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((p) => !p)}
            className="relative rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Notifications"
          >
            <BellOutlined className="text-base" />
            <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <span className="text-sm font-semibold text-gray-800">Notifications</span>
                  <button className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                    <CheckCircleOutlined /> Mark all read
                  </button>
                </div>
                {[
                  { title: "New user registered", time: "2m ago", unread: true },
                  { title: "Report generated", time: "1h ago", unread: true },
                  { title: "Server restarted", time: "3h ago", unread: false },
                ].map((n, i) => (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 ${n.unread ? "bg-indigo-50/40" : ""}`}>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.unread ? "bg-indigo-500" : "bg-transparent"}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-400">{n.time}</p>
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-100 px-4 py-2 text-center">
                  <button className="text-xs text-indigo-600 hover:underline">View all</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Avatar / user menu */}
        <button className="ml-1 flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            TK
          </div>
          <div className="hidden flex-col text-left sm:flex">
            <span className="text-xs font-medium text-gray-800 leading-none">Tarakshubham</span>
            <span className="text-[10px] text-gray-400 leading-none mt-0.5">Admin</span>
          </div>
        </button>
      </div>
    </header>
  );
}
