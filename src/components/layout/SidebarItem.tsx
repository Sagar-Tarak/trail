import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { NavItem } from "./types";
import { DownOutlined } from "@ant-design/icons";

interface Props {
  item: NavItem;
  collapsed: boolean;
  depth?: number;
}

export function SidebarItem({ item, collapsed, depth = 0 }: Props) {
  const { pathname } = useLocation();
  const hasChildren = !!item.children?.length;
  const isChildActive =
    item.children?.some((c) => c.href === pathname) ?? false;
  const [open, setOpen] = useState(isChildActive && hasChildren);

  const baseClasses = `
    group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
    transition-all duration-150 select-none
    ${depth > 0 ? "pl-9" : ""}
  `;

  if (hasChildren) {
    return (
      <li>
        <button
          onClick={() => setOpen((p) => !p)}
          className={`${baseClasses} cursor-pointer ${
            isChildActive
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          {item.icon && (
            <span
              className={`shrink-0 ${isChildActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`}
            >
              {item.icon}
            </span>
          )}
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-left">{item.label}</span>
              <DownOutlined
                className={`text-xs text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </>
          )}
        </button>

        {!collapsed && open && (
          <ul className="mt-0.5 space-y-0.5 border-l border-gray-200 ml-5">
            {item.children!.map((child) => (
              <SidebarItem
                key={child.href}
                item={child}
                collapsed={collapsed}
                depth={depth + 1}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li className="relative">
      <NavLink
        to={item.href}
        end={item.href === "/"}
        title={collapsed && depth === 0 ? item.label : undefined}
        className={({ isActive }) =>
          `${baseClasses} ${
            isActive
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`
        }
      >
        {({ isActive }) => (
          <>
            {item.icon && (
              <span
                className={`shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`}
              >
                {item.icon}
              </span>
            )}

            {!collapsed && (
              <>
                <span className="flex-1 truncate text-left">{item.label}</span>
                {item.badge != null && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}

            {collapsed && item.badge != null && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            )}
          </>
        )}
      </NavLink>

      {/* Collapsed tooltip */}
      {collapsed && depth === 0 && (
        <div
          className="pointer-events-none absolute left-full top-0 z-50 ml-2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
          role="tooltip"
        >
          {item.label}
        </div>
      )}
    </li>
  );
}
