import {
  DashboardIcon,
  UsersIcon,
  AnalyticsIcon,
  ActivityIcon,
  ReportsIcon,
  SettingsIcon,
} from "@/components/layout/icons";
import type { NavItem } from "@/components/layout/types";

export const ROUTES = {
  DASHBOARD: "/",
  ACTIVITIES: "/activities",
  TIMELINE: "/timeline",
  USERS: "/users",
  RECORDS: "/records",
  TRANSACTIONS: "/transactions",
  ERRORS: "/errors",
  REPORTS: "/reports",
  SOFTWARE: "/software",
  SETUP: "/setup",
  SDK: "/sdk-setup",
  // Auth
  LOGIN: "/auth/login",
} as const;

/** Routes that appear in the main nav (excludes auth routes) */
export type AppRoute = Exclude<
  (typeof ROUTES)[keyof typeof ROUTES],
  "/auth/login"
>;

/** Nav items for the sidebar — order determines display order */
export const NAV_ITEMS: NavItem[] = [
  { label: "SDK guide", href: ROUTES.SDK, icon: <ReportsIcon /> },
  { label: "Setup guide", href: ROUTES.SETUP, icon: <ReportsIcon /> },
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: <DashboardIcon /> },
  { label: "Activity timeline", href: ROUTES.TIMELINE, icon: <ActivityIcon /> },
  { label: "Activities", href: ROUTES.ACTIVITIES, icon: <ActivityIcon /> },
  { label: "Team & account", href: ROUTES.USERS, icon: <UsersIcon /> },
  { label: "Transactions", href: ROUTES.TRANSACTIONS, icon: <ReportsIcon /> },
  { label: "Change reports", href: ROUTES.REPORTS, icon: <AnalyticsIcon /> },
  { label: "Records", href: ROUTES.RECORDS, icon: <ReportsIcon /> },
  { label: "Errors", href: ROUTES.ERRORS, icon: <AnalyticsIcon /> },
  { label: "Database", href: ROUTES.SOFTWARE, icon: <SettingsIcon /> },
];

/** Page title shown in the navbar for each route */
export const ROUTE_TITLES: Record<AppRoute, string> = {
  [ROUTES.DASHBOARD]: "Dashboard",
  [ROUTES.SETUP]: "Company setup guide",
  [ROUTES.SDK]: "SDK installation guide",
  [ROUTES.ACTIVITIES]: "Activities",
  [ROUTES.TIMELINE]: "Activity timeline",
  [ROUTES.USERS]: "Team & account",
  [ROUTES.RECORDS]: "Records",
  [ROUTES.TRANSACTIONS]: "Transactions",
  [ROUTES.REPORTS]: "Change reports",
  [ROUTES.ERRORS]: "Errors",
  [ROUTES.SOFTWARE]: "Database",
};
