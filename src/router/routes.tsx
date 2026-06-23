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
  DASHBOARD:  "/",
  ACTIVITIES: "/activities",
  USERS:      "/users",
  RECORDS:    "/records",
  ERRORS:     "/errors",
  SOFTWARE:   "/software",
  // Auth
  LOGIN:      "/auth/login",
} as const;

/** Routes that appear in the main nav (excludes auth routes) */
export type AppRoute = Exclude<(typeof ROUTES)[keyof typeof ROUTES], "/auth/login">;

/** Nav items for the sidebar — order determines display order */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",  href: ROUTES.DASHBOARD,  icon: <DashboardIcon />  },
  { label: "Activities", href: ROUTES.ACTIVITIES, icon: <ActivityIcon />,  badge: 12 },
  { label: "Users",      href: ROUTES.USERS,      icon: <UsersIcon />      },
  { label: "Records",    href: ROUTES.RECORDS,    icon: <ReportsIcon />    },
  { label: "Errors",     href: ROUTES.ERRORS,     icon: <AnalyticsIcon />  },
  { label: "Software",   href: ROUTES.SOFTWARE,   icon: <SettingsIcon />   },
];

/** Page title shown in the navbar for each route */
export const ROUTE_TITLES: Record<AppRoute, string> = {
  [ROUTES.DASHBOARD]:  "Dashboard",
  [ROUTES.ACTIVITIES]: "Activities",
  [ROUTES.USERS]:      "Users",
  [ROUTES.RECORDS]:    "Records",
  [ROUTES.ERRORS]:     "Errors",
  [ROUTES.SOFTWARE]:   "Software",
};
