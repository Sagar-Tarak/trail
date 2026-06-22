import { type ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useLayoutStore } from "../../store/useLayoutStore";
import {
  DashboardIcon,
  UsersIcon,
  AnalyticsIcon,
  ActivityIcon,
  ReportsIcon,
  SettingsIcon,
} from "./icons";
import type { NavItem } from "./types";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <DashboardIcon /> },
  { label: "Activities", href: "/activities", icon: <ActivityIcon />, badge: 12 },
  { label: "Users", href: "/users", icon: <UsersIcon /> },
  { label: "Records", href: "/records", icon: <ReportsIcon /> },
  { label: "Errors", href: "/errors", icon: <AnalyticsIcon /> },
  { label: "Software", href: "/software", icon: <SettingsIcon /> },
];

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  onNavigate?: (href: string) => void;
}

export function AppLayout({ children, title, onNavigate }: AppLayoutProps) {
  const { sidebarCollapsed: collapsed, setSidebarCollapsed, toggleSidebar } = useLayoutStore();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar items={NAV_ITEMS} collapsed={collapsed} onCollapse={setSidebarCollapsed} onNavigate={onNavigate} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar title={title} onMenuToggle={toggleSidebar} sidebarCollapsed={collapsed} />

        {/* max-w-7xl keeps content readable on wide monitors */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
