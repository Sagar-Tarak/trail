import { CompanyScopeNotice } from "@/features/company/CompanyScopeNotice";
import { useState, useSyncExternalStore, useLayoutEffect, useRef } from "react";
import { PageSuspense } from "@/router/PageSuspense";
import { Drawer } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useLayoutStore } from "@/store/useLayoutStore";
import { NAV_ITEMS, ROUTE_TITLES, type AppRoute } from "@/router/routes.tsx";

const mobileQuery = () => window.matchMedia("(max-width: 767px)");
const subscribeMobile = (callback: () => void) => {
  const query = mobileQuery();
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const getMobile = () => mobileQuery().matches;

export function RootLayout() {
  const { pathname, search } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const scrollPositions = useRef(new Map<string, number>());
  const scrollKey = pathname + search;
  useLayoutEffect(() => {
    if (mainRef.current)
      mainRef.current.scrollTop = scrollPositions.current.get(scrollKey) ?? 0;
  }, [scrollKey]);
  const {
    sidebarCollapsed: collapsed,
    setSidebarCollapsed,
    toggleSidebar,
  } = useLayoutStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    getMobile,
    () => false,
  );
  const title =
    ROUTE_TITLES[pathname as AppRoute] ??
    (pathname.startsWith("/activities/")
      ? "Activity details"
      : pathname.startsWith("/transactions/")
        ? "Transaction details"
        : "Trio Trail");
  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      <div className="hidden shrink-0 md:flex">
        <Sidebar
          items={NAV_ITEMS}
          collapsed={collapsed}
          onCollapse={setSidebarCollapsed}
        />
      </div>
      <Drawer
        title="Company navigation"
        placement="left"
        width={280}
        open={isMobile && mobileOpen}
        onClose={() => setMobileOpen(false)}
        styles={{ body: { padding: 0, display: "flex" } }}
      >
        <div
          className="flex w-full [&>aside]:w-full"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a"))
              setMobileOpen(false);
          }}
        >
          <Sidebar items={NAV_ITEMS} onCollapse={() => setMobileOpen(false)} />
        </div>
      </Drawer>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          title={title}
          onMenuToggle={
            isMobile ? () => setMobileOpen((open) => !open) : toggleSidebar
          }
          sidebarCollapsed={isMobile ? !mobileOpen : collapsed}
        />
        {/^\/(?:$|timeline|activities|transactions|records|reports|errors)(?:\/|$)/.test(
          pathname,
        ) && <CompanyScopeNotice />}
        <main
          ref={mainRef}
          onScroll={(event) => {
            const positions = scrollPositions.current;
            positions.set(scrollKey, event.currentTarget.scrollTop);
            if (positions.size > 100)
              positions.delete(positions.keys().next().value!);
          }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
        >
          <div className="mx-auto max-w-[1600px]">
            <PageSuspense>
              <Outlet />
            </PageSuspense>
          </div>
        </main>
      </div>
    </div>
  );
}
