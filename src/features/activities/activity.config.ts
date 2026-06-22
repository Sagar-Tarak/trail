import { activityColumns } from "./activity.columns";
import { activityFilters } from "./activity.filters";
import { activityRowActions, activityToolbarActions, activityBulkActions } from "./activity.actions.tsx";
import { useActivitiesQuery } from "./activity.query";
import { ActivityDrawer } from "./activity.drawer";
import type { Activity } from "./activity.types";
import type { MasterTableConfig } from "@/layouts/MasterTablePage";

export const activityConfig: MasterTableConfig<Activity> = {
  title: "Activities",
  subtitle: "All audit events across modules — searchable, filterable, exportable.",
  breadcrumbs: [{ label: "Home" }, { label: "Activities" }],
  rowKey: "id",
  // bump this key if you change column/filter shape to avoid reading stale localStorage
  persistenceKey: "activities-v1",
  searchPlaceholder: "Search by user, action, module, email…",
  defaultPageSize: 20,
  defaultDensity: "default",

  columns: activityColumns,
  filters: activityFilters,
  rowActions: activityRowActions,
  toolbarActions: activityToolbarActions,
  bulkActions: activityBulkActions,

  queryHook: useActivitiesQuery,

  drawer: {
    component: ActivityDrawer,
    width: 480,
    title: (a) => `Activity · ${a.id}`,
  },

  permissions: {
    export: true,
    bulkDelete: true,
  },

  emptyState: {
    title: "No activities found",
    description: "Try adjusting your search or filters.",
  },
};
