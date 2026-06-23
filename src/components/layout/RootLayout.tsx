import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useLayoutStore } from "@/store/useLayoutStore";
import { NAV_ITEMS, ROUTE_TITLES, type AppRoute } from "@/router/routes.tsx";

export function RootLayout() {
  const { pathname } = useLocation();
  const { sidebarCollapsed: collapsed, setSidebarCollapsed, toggleSidebar } = useLayoutStore();

  const title = ROUTE_TITLES[pathname as AppRoute] ?? "TrailApp";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar items={NAV_ITEMS} collapsed={collapsed} onCollapse={setSidebarCollapsed} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar title={title} onMenuToggle={toggleSidebar} sidebarCollapsed={collapsed} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
